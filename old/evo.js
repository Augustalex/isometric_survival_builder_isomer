
//credits
//work to gain credits, or ask others to give you money

//friendIndex
//Go out to meet people and make friends. Higher friendIndex means several deep friendships.

//hasPartner
//Boolean, 0: No partner, 1: Has partner

//childrenCount
//Count of children had with partner. Cannot have more than 0 children if hasPartner is false

//powerIndex
//If worked enough will have higher powerIndex

//knowledgeIndex
//If worked enough will have higher knowledge index. If have more friends will also increase knowledge index.

//sleepHours
//How many hours of sleep per night. Less than 7 hours will decrease knowledgeIndex.

//work
// +credits * powerIndex
// +friendIndex
// +knowledgeIndex * friendIndex

//go out
// +powerIndex
// +friendIndex
// -sleepHours
// hasPartner = random() < .01

function blobFactory () {
    return {
        createBlob
    }
    
    function createBlob() {
        
        let credits = 0
        let friendIndex = 1
        let powerIndex = 1
        let knowledgeIndex = 1
        
        let sleepHours = 8
        let lostSleep = 0
        
        let childrenCount = 0
        let hasPartner = false
        
        return {
            work,
            goOut,
            sleep
        }
        
        function work() {
            credits += 100 * powerIndex
            friendIndex += .01
            powerIndex += .001
            knowledgeIndex += .005
        }
        
        function goOut() {
            powerIndex += .001
            friendIndex += .01
            lostSleep = 2
            hasPartner = Math.random () < .0001
        }
        
        function sleep() {
            if(lostSleep > 2) {
                knowledgeIndex -= .005
                lostSleep -= 2
            }
        }
    }
}

function process(blobs) {
    for(let blob of blobs) {
        blob.work()
        if(Math.random() < .2){
            blob.goOut()
        }
        blob.sleep()
    }
}

function loop() {
    let blobFactory = blobFactory()
    
    let blobs = []
    for(let i = 0; i < 20; i++){
        blobs.push(blobFactory.createBlob())
    }
    let l = () => {
        process(blobs)
        requestAnimationFrame(l)
    }
    requestAnimationFrame(l)
}

loop()