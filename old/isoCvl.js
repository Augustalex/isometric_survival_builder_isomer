var Point = Isomer.Point;
var Path = Isomer.Path;
var Shape = Isomer.Shape;
var Vector = Isomer.Vector;
var Color = Isomer.Color;

var red = new Color(160, 60, 50);
var blue = new Color(50, 60, 160);

function RenderObject({init}) {
    return {
        init(iso) {
            init(iso)
        }
    }
}

function Blob({point}) {
    return RenderObject({
        init(iso) {
            iso.add(Shape.Pyramid(point), red)
        }
    })
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
            init(iso) {
                iso.add(Shape.Prism(Point.ORIGIN, width, height, 1));
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

function Player() {
    let x = 1
    let y = 1
    let z = 1
    let dx = 1
    let dy = 1
    let dz = 1
    let shape = Shape.Prism(Point(x, y, z), dx, dy, dz)
    return {
        ...RenderObject({
            init(iso) {
                iso.add(shape)
            }
        }),
        moveUp(iso) {
            // iso.remove(shape)
            iso.add(shape.translate(1, 0, 0))
            console.log('translate shape')
        }
    }
}

(function () {
    let canvas = document.getElementById("screen")
    let iso = new Isomer(document.getElementById("screen"));
    // iso.add(Shape.Prism(Point.ORIGIN, 3, 3, 1));
    
    // let map = Map({width: 10, height: 10, tileSize: 150})
    // map.init(iso)
    
    let player = Player()
    player.init(iso)
    window.addEventListener('keydown', e => {
        console.log('hello', e.key)
        if (e.key === 'w') {
            player.moveUp(iso)
        }
    })
    let blobs = [
        Blob({point: Point(1, 2, 3)}),
        Blob({point: Point(1, 1, 3)})
    ]
    for (let blob of blobs) {
        blob.init(iso)
    }
})()