window.blobCount = 0
window.deathCount = 0
window.blobSizes = []
window.avgBlobSize = 0
window.sexLevel = 0
window.time = 0

window.stat = {}
window.stat['01'] = 0
window.stat['10'] = 0
window.stat['00'] = 0
window.stat['11'] = 0

const SCALE_FACTOR = 5
const WORLD_CONSTRAINTS = {x: 1000 / SCALE_FACTOR, y: 1000 / SCALE_FACTOR}
const TIME_LIMIT = 0
const MOVEMENT_SPEED_MULTIPLIER = .5

const MUTATION_CHANCE = .1
const DEATH_LEVEL = .005
const SIZE_LIMIT = 80
const AGE_LIMIT = 500
const BABY_DEATH_RISK = .8

function Blob(previousSelf, blobOptions) {
    let {delta} = blobOptions
    
    if (!previousSelf) {
        let x = WORLD_CONSTRAINTS.x * .5 + Math.random() * 10
        let y = WORLD_CONSTRAINTS.y * .5 + Math.random() * 10
        return [{
            pos: {x, y},
            image: [[1]],
            color: randColor(),
            age: 1,
            gene: gene()
        }]
    }
    if (previousSelf.age > AGE_LIMIT) {
        window.deathCount++
        return []
        // return split(previousSelf, blobOptions)
    }
    
    let avgSize = previousSelf.image.length + previousSelf.image.reduce((a, b) => a + b.length, 0)
    // if (window.blobCount > 10 && avgSize / window.avgBlobSize < DEATH_LEVEL) {
    //     window.deathCount++
    //     return []
    // }
    
    let xAvgSize = previousSelf.image.reduce((acc, row) => {
        return acc + row.length
    }, 0) / previousSelf.image.length
    let ySize = previousSelf.image.length
    let balanceX = xAvgSize / ySize
    let balanceY = ySize / xAvgSize
    // if (balanceX < .2 && !previousSelf.isSplit) {
    //     return [...split(previousSelf, blobOptions), ...split(previousSelf, blobOptions), ...split(previousSelf, blobOptions)]
    // }
    
    // let xDirection = previousSelf.pos.x > 0 ? (previousSelf.pos.x < constraints.x ? (Math.random() < .5 ? -1 : 1) : -1) : 1
    // let yDirection = previousSelf.pos.y > 0 ? (previousSelf.pos.y < constraints.y ? (Math.random() < .5 ? -1 : 1) : -1) : 1
    // let x = previousSelf.pos.x + xDirection * delta
    // let y = previousSelf.pos.y + yDirection * delta
    let composition = Composition(previousSelf.gene)
    functionBank['walk'].handler(previousSelf, composition.walk, {delta})
    functionBank['mutateWalk'].handler(previousSelf, 4, 7, {delta})
    functionBank['think'].handler(previousSelf, 8, 11, {delta})
    
    let newImage = previousSelf.image.map(i => [...i])
    
    let growX = avgSize < SIZE_LIMIT ? (Math.random() < (.5 / balanceX) * delta) : false
    let growY = avgSize < SIZE_LIMIT ? (Math.random() < (.5 / balanceY) * delta) : false
    
    let lengthY = newImage.length
    let lengthX = newImage.length
    let indexX = Math.round(lengthX * Math.random())
    let indexY = Math.round(lengthY * Math.random())
    if (growX) {
        if (indexY >= newImage.length) {
            indexY = newImage.length - 1
        }
        
        newImage[indexY].splice(indexX, 0, 1)
    }
    if (growY) {
        newImage.splice(indexY, 0, [1])
    }
    
    return [{
        pos: previousSelf.pos,
        image: newImage,
        color: previousSelf.color,
        age: previousSelf.age + 1,
        gene: previousSelf.gene
    }]
}

function randColor() {
    return [
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255)
    ]
}

function mutateColor(rgb) {
    let index = Math.round(Math.random() * 2)
    let color = [...rgb]
    let diff = Math.random() < .5 ? -1 : 1
    color[index] = color[index] += diff * 20
    return color
}

function mate(a, b, blobOptions) {
    if (Math.random() < BABY_DEATH_RISK) return []
    
    let firstHalf = a.image.slice(0, Math.round(a.image.length / 2))
    let secondHalf = b.image.slice(0, Math.round(b.image.length / 2))
    return Blob({...a, age: 1, image: [...firstHalf, ...secondHalf]}, blobOptions)
}

function split(blob, blobOptions) {
    let splitPoint = Math.round(Math.random() * blob.image.length - 1)
    return [
        ...Blob({
            ...blob,
            image: blob.image.slice(0, splitPoint),
            color: mutateColor(blob.color),
            isSplit: true,
            age: 1,
            gene: mutateString(blob.gene)
        }, blobOptions),
        ...Blob({
            ...blob,
            image: blob.image.slice(splitPoint),
            color: mutateColor(blob.color),
            isSplit: true,
            age: 1,
            gene: mutateString(blob.gene)
        }, blobOptions)
    ]
}

function blobsCollide(blobs) {
    for (let source of blobs) {
        for (let target of blobs) {
            if (source === target) continue
            
            for (let y = 0; y < source.image.length; y++) {
                for (let x = 0; x < source.image[y].length; x++) {
                    for (let ty = 0; ty < target.image.length; ty++) {
                        for (let tx = 0; tx < target.image[ty].length; tx++) {
                            if (source.pos.x + x === target.pos.x + tx) {
                                target.image[ty].splice(tx, target.image[ty].length - tx)
                            }
                        }
                        if (source.pos.y + y === target.pos.y + ty) {
                            target.image.splice(ty, target.image.length)
                        }
                    }
                }
            }
        }
    }
}

function blobsCollideMate(blobs, blobOptions) {
    let children = []
    for (let source of blobs) {
        for (let target of blobs) {
            if (source === target) continue
            if (within(source, target)) {
                children.push(...mate(source, target, blobOptions))
            }
            // for (let y = 0; y < source.image.length; y++) {
            //     for (let x = 0; x < source.image[y].length; x++) {
            //         for (let ty = 0; ty < target.image.length; ty++) {
            //             for (let tx = 0; tx < target.image[ty].length; tx++) {
            //                 if (source.pos.x + x === target.pos.x + tx) {
            //                     return mate(source, target, blobOptions)
            //                     tx = 100000
            //                     skip = true
            //                 }
            //             }
            //             if (source.pos.y + y === target.pos.y + ty) {
            //                 return mate(source, target, blobOptions)
            //             }
            //             if (skip) {
            //                 ty = 100000
            //             }
            //         }
            //         if (skip) {
            //             x = 100000
            //         }
            //     }
            //     if (skip) {
            //         y = 100000
            //     }
            // }
        }
    }
    
    return children
}

function progress(blobs, blobOptions) {
    let newBlobs = []
    for (let blob of blobs) {
        if (blob.pos.x > WORLD_CONSTRAINTS.x || blob.pos.x < 0
            || blob.pos.y > WORLD_CONSTRAINTS.y || blob.pos.y < 0) {
            continue
        }
        newBlobs.push(...Blob(blob, blobOptions))
    }
    // blobsCollide(newBlobs)
    let children = blobsCollideMate(newBlobs, blobOptions)
    // if (children.length) {
    //     console.log(children.length)
    // }
    window.sexLevel = children.length / newBlobs.length
    newBlobs.push(...children)
    window.avgBlobSize = newBlobs.reduce((acc, blob) => {
        return acc + blob.image.length + blob.image.reduce((a, b) => a + b.length, 0)
    }, 0) / newBlobs.length
    
    window.time++
    window.blobCount = newBlobs.length
    
    return newBlobs
}

function renderBlob(blob, ctx, {delta}) {
    let paintPos = {x: blob.pos.x, y: blob.pos.y}
    blob.image.forEach((row, index) => {
        let dir = index % 2 ? -1 : 1
        row.forEach(() => {
            let [r, g, b] = blob.color
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            ctx.fillRect(Math.round(paintPos.x) * SCALE_FACTOR, Math.round(paintPos.y) * SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR);
            paintPos.x += dir
        })
        paintPos.x = blob.pos.x
        paintPos.y++
    })
}

const range = 100;

function within({pos: pos1, image: image1}, {pos: pos2, image: image2}) {
    return pos1.x - range > pos2.x
        || pos1.x + range < pos2.x
        || pos1.y - range < pos2.y
        || pos1.y + range > pos2.y;
    
}

/*
    Contains gene functions settings and handlers referenced from a blob's "composition".
 */
const functionBank = {
    walk: {
        size: 9,
        handler(blob, string, {delta}) {
            //00.. dont walk    01.. dont walk
            //11.. do walk 2    10.. do walk
            //..01 walk right   ..10 walk left
            //..00 walk up      ..11 walk down
            let actionCode = string.substr(0, 2)
            let modifierCode = string.substr(2, 2)
            
            let steps = 0
            let xVel = 0
            let yVel = 0
            switch (actionCode) {
                case '10':
                    steps = 1
                    break
                case '11':
                    steps = 2
                    break
            }
            switch (modifierCode) {
                case '01':
                    window.stat['01']++
                    if (steps === 2) {
                        window.stat['01']++
                    }
                    xVel = -1
                    break
                case '10':
                    window.stat['10']++
                    if (steps === 2) {
                        window.stat['10']++
                    }
                    xVel = 1
                    break
                case '00':
                    window.stat['00']++
                    if (steps === 2) {
                        window.stat['00']++
                    }
                    yVel = 1
                    break
                case '11':
                    window.stat['11']++
                    if (steps === 2) {
                        window.stat['11']++
                    }
                    yVel = -1
            }
            blob.pos = {
                x: blob.pos.x + xVel * steps * delta * MOVEMENT_SPEED_MULTIPLIER,
                y: blob.pos.y + yVel * steps * delta * MOVEMENT_SPEED_MULTIPLIER
            }
        }
    },
    mutateWalk: {
        handler(blob, startIndex, endIndex, {delta}) {
            let walkGene = blob.gene.substr(0, 4)
            let mutateWalkGene = blob.gene.substr(4, 4)
            let newCode = []
            let index = 0
            for (let c of mutateWalkGene) {
                let walkCodeChar = walkGene.charAt(index)
                newCode.push(c === '1' ? (walkCodeChar === '1' ? '0' : '1') : walkCodeChar)
                index++
            }
            blob.gene = [blob.gene.substring(0, startIndex), newCode, blob.gene.substring(endIndex)].join('')
            // let newWalkCode = [
            //     Math.random() < MUTATION_CHANCE ? '1' : '0',
            //     Math.random() < MUTATION_CHANCE ? '1' : '0',
            //     Math.random() < MUTATION_CHANCE ? (walkGene.substr(2,1) === '1' ? '0' : '1') : walkGene.substr(2,1),
            //     Math.random() < MUTATION_CHANCE ? (walkGene.substr(3,1) === '1' ? '0' : '1') : walkGene.substr(3,1)
            // ];
            // blob.gene = [newWalkCode.join(''), blob.gene.substr(4)].join('')
        }
    },
    think: {
        size: 4,
        handler(blob, startIndex, endIndex) {
            // 1010
            // [0-1]: 00 - 1%, 01 - 2%, 10 - 4%, 11 - 8% (Chance)
            // [2-3]: 00 - Mutate, 01 - Set to 0000, 10 - Set to 1111, 11 - Mutate
            let thinkGene = blob.gene.substr(startIndex, this.size)
            let mutateWalkGene = blob.gene.substr(startIndex - 4, 4)
            let newMutateWalkCode = []
            
            let changeGene = thinkGene.substr(0, 2)
            let actionGene = thinkGene.substr(2, 2)
            let chance = 0
            switch(changeGene) {
                case "00":
                    chance = .01
                    break
                case "01":
                    chance = .02
                    break
                case "10":
                    chance = .04
                    break
                case "11":
                    chance = .08
                    break
            }
            if(Math.random() < .8) {
                return
            }
            let action
            switch(actionGene) {
                case "00":
                case "11":
                    action = 'mutate'
                    let randIndex = Math.round(Math.random() * 4)
                    for(let c of mutateWalkGene){
                        newMutateWalkCode.push(c)
                    }
                    newMutateWalkCode.splice(randIndex, 1, Math.random() < .5 ? '1' : '0')
                    break
                case "01":
                    action = 'min'
                    newMutateWalkCode = ['0', '0', '0', '0']
                    break
                case "10":
                    action = 'max'
                    newMutateWalkCode = ['1', '1', '1', '1']
                    break
            }
            blob.gene = [blob.gene.substr(0, 4), newMutateWalkCode.join(''), thinkGene, blob.gene.substr(endIndex)].join('')
        }
    },
    grow: {
        size: 5
    }
}

function mutateString(string) {
    let res = []
    for (let c of string) {
        res.push(Math.random() < MUTATION_CHANCE ? (c === '1' ? '0' : '1') : c)
    }
    return res.join('')
}

/*
    Creates a random string of 1s and 0s.
 */
function gene() {
    let geneBits = []
    for (let i = 0; i < 13; i++) {
        geneBits.push(Math.random() < .5 ? '1' : '0')
    }
    return geneBits.join('')
}

/*
    Composition is the genome programming. Tells what parts of a genome is a certain function.
    Currently this is put as the same for each blob. But in the future different blobs will
    probably have different programmings and might even inherit programmings from its ancestors.
 */
function Composition(gene) {
    let comp = {}
    if (gene.length >= 4) {
        comp['walk'] = gene.substr(0, 4)
    }
    if (gene.length >= 8) {
        comp['mutateWalk'] = gene.substr(4, 4)
    }
    
    return comp
}

(function () {
    let canvas = document.querySelector('#screen')
    let ctx = canvas.getContext('2d')
    
    let blobOptions = {}
    let blobs = [];
    [Blob, Blob, Blob, Blob, Blob, Blob, Blob, Blob].forEach(b => {
        blobs.push(...b(null, blobOptions))
    })
    
    ctx.fillStyle = 'green';
    let batch = blobs
    
    let stop = false
    let pause = false
    
    let prevTime = 0
    let step = (time) => {
        blobOptions.delta = (time - prevTime) / 100
        
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (!pause) {
            batch.forEach(b => renderBlob(b, ctx, blobOptions))
        }
        
        ctx.fillStyle = 'black'
        ctx.font = '48px Arial'
        if (pause) {
            ctx.fillText(`Pause`, 500, 500)
        }
        ctx.fillText(`Blob count: ${window.blobCount} Avg size: ${Math.round(window.avgBlobSize)} Death level: ${Math.round(window.avgBlobSize * DEATH_LEVEL)} Death count: ${window.deathCount} Mate rate: ${window.sexLevel}`, 50, 50)
        ctx.fillText(`Time: ${window.time}`, 50, 110)
        let stats = Object.keys(window.stat).map(key => `${key}: ${window.stat[key]}`)
        ctx.fillText(`STATS: [${stats}]`, 50, 170)
        
        if (!pause) {
            ctx.strokeStyle = 'red'
            ctx.strokeRect(0, 0, 1000, 1000)
            batch = progress(batch, blobOptions)
        }
        
        if (stop) return
        prevTime = time
        window.requestAnimationFrame(step)
    }
    window.requestAnimationFrame(step)
    
    queuePause = () => {
        setTimeout(() => {
            pause = true
            window.onkeydown = (e) => {
                if (e.key === ' ') {
                    pause = false
                    queuePause()
                }
            }
        }, 5000)
    }
    queuePause()
    if (TIME_LIMIT) {
        setTimeout(() => {
            stop = true
        }, TIME_LIMIT)
    }
    
})()

