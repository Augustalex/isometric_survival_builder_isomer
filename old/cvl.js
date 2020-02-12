function RenderObject({render}) {
    return {
        render(context) {
            render(context)
        }
    }
}

function TileInterface({width, height, tileSize}) {
    
    return {}
}

function Screen(canvas, {showBorders = false} = {}) {
    let context = canvas.getContext('2d')
    let width = canvas.width
    let height = canvas.height
    
    let renderObjects = []
    
    return {
        addRenderObject(renderObject) {
            renderObjects.push(renderObject)
        },
        render() {
            context.clearRect(0, 0, width, height)
            if (showBorders) {
                context.lineWidth = 5
                context.strokeStyle = 'black'
                context.strokeRect(0, 0, width, height)
            }
            
            for (let renderObject of renderObjects) {
                renderObject.render(context)
            }
        },
        getDimensions() {
            return {width, height}
        }
    }
}

function Tile({x, y, tileSize}) {
    return {
        isPointInTile(pointX, pointY) {
            return pointX > x && pointX < x + tileSize
                && pointY > y && pointY < y + tileSize
        },
        getPosition: () => ({x, y}),
        getDimensions: () => ({width: tileSize, height: tileSize})
    }
}

function Map({width, height, tileSize}) {
    let tiles = []
    for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
            tiles.push(Tile({x, y, tileSize}))
        }
    }
    
    return {
        ...RenderObject({
            render(context) {
                context.lineWidth = 1
                context.strokeStyle = '#666'
                for (let x = 0; x < width; x += tileSize) {
                    for (let y = 0; y < height; y += tileSize) {
                        context.strokeRect(x, y, tileSize, tileSize)
                    }
                }
            }
        }),
        getTilesOnPoint(pointX, pointY) {
            let hits = []
            for (let tile of tiles) {
                if (tile.isPointInTile(pointX, pointY)) {
                    hits.push(tile)
                }
            }
            return hits
        }
    }
}

function ContextMenu({canvas, map, itemNames, actionMap}) {
    let closed = true
    let position = {
        x: 0,
        y: 0
    }
    
    let items = []
    let itemY = 0
    const itemHeight = 60
    const itemWidth = 210
    for (let itemName of itemNames) {
        items.push(ContextMenuItem({
            itemName,
            x: 0,
            y: itemY,
            width: itemWidth,
            height: itemHeight,
            action: actionMap[itemName]
        }))
        itemY += itemHeight
    }
    
    canvas.addEventListener('click', (e) => {
        let [firstHit] = map.getTilesOnPoint(e.offsetX, e.offsetY)
        console.log(firstHit.getDimensions(), firstHit.getPosition())
        let itemHit = false
        for (let item of items) {
            if (!closed && item.isPointInItem(e.offsetX, e.offsetY)) {
                itemHit = true
                item.clicked(firstHit)
                closed = true
            }
            else {
                item.setOffset(e.offsetX, e.offsetY)
            }
        }
        if (!itemHit) {
            position.x = e.offsetX
            position.y = e.offsetY
            closed = false
        }
    })
    
    return RenderObject({
        render(context) {
            if (closed) return
            
            context.fillStyle = '#D6D6D6'
            context.fillRect(position.x, position.y, 210, 180)
            for (let item of items) {
                item.render(context)
            }
        }
    })
}

function ContextMenuItem({itemName, x, y, width, height, action}) {
    const fontSize = 30
    const textPosY = y + height - height * .5 + fontSize * .33
    const textPosX = x + 10
    let offsetX = 0
    let offsetY = 0
    return {
        ...RenderObject({
            render(context) {
                context.fillStyle = '#333'
                context.fillRect(x + offsetX, y + offsetY, width, height)
                context.fillStyle = '#fff'
                context.font = `${fontSize}px Helvetica`
                context.fillText(itemName, textPosX + offsetX, textPosY + offsetY, width - 10)
            }
        }),
        clicked(...args) {
            action(...args)
        },
        isPointInItem(pointX, pointY) {
            return utils.isPointIn(pointX, pointY, x + offsetX, y + offsetY, width, height)
        },
        setOffset(_offsetX, _offsetY) {
            offsetX = _offsetX
            offsetY = _offsetY
        }
    }
}

function Building({tile}) {
    let {x, y} = tile.getPosition()
    x = x + 10
    y = y + 10
    let {width, height} = tile.getDimensions()
    let size = width * .8
    
    return RenderObject({
        render(context) {
            context.fillStyle = 'brown'
            context.fillRect(x, y, size, size)
        }
    })
}

(function () {
    let canvas = document.getElementById('screen')
    let screen = Screen(canvas, {showBorders: true})
    let {width: screenWidth, height: screenHeight} = screen.getDimensions()
    
    let blob = RenderObject({
        render(context) {
            context.fillStyle = 'green'
            context.fillRect(10, 10, 250, 250)
        }
    })
    let map = Map({width: screenWidth, height: screenHeight, tileSize: 150})
    let actionMap = {
        'House'(tile) {
            let house = Building({tile})
            screen.addRenderObject(house)
        }
    }
    let contextMenu = ContextMenu({canvas, map, itemNames: ['House'], actionMap})
    screen.addRenderObject(map)
    screen.addRenderObject(blob)
    screen.addRenderObject(contextMenu)
    
    let loop = () => {
        screen.render()
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
})()

const utils = {
    isPointIn(pointX, pointY, targetX, targetY, targetWidth, targetHeight) {
        return pointX > targetX && pointX < targetX + targetWidth
            && pointY > targetY && pointY < targetY + targetHeight
    }
}


// $$$ print tiled map
// $$$ click tile to open context menu
// $$$ click item in context menu to place it on tile