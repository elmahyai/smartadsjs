
var video_conditions = []
var waiting_video_url = ''
var waiting_video_id = 0
var screen_code = window.prompt("Enter screen code: ");
var api_url = 'https://wakeb-ads.azurewebsites.net/Adv-master/api/client/adv/' + screen_code + '/send-adv' 
function adv_data () {
    $.ajax({
    
    type:'GET',
    
    url: api_url,
    success:function(data){
        video_conditions =  data.videos_list 
        waiting_url = data.waiting_url
        not_predicted_url = data.not_predicted_url;
        video_conditions.forEach(function(video_condition){
            // console.log(video_condition)
    
            if (video_condition.glasses == 0 && video_condition.noglasses == 0 && video_condition.male == 0 &&
                video_condition.female == 0 && video_condition['5-15'] == 0 && video_condition['15-25'] == 0 &&
                 video_condition['25-35'] == 0 && video_condition['35-45'] == 0 && video_condition['45-45'] == 0 &&
                 video_condition['55-'] == 0  ){
                    // console.log("waiting_video_running")
                    waiting_video_id = video_condition.video_id
                    waiting_video_url = video_condition.video_url
        
            }
        })
    }}); 

 }
 adv_data()
 window.setInterval(adv_data,100000);

var URL = "static/models"
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(URL),
    faceapi.nets.ageGenderNet.loadFromUri(URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(URL),
    faceapi.nets.faceExpressionNet.loadFromUri(URL)
]).then(loadTheVideo());

var videoEl = document.getElementById('inputVideo')
// canvas for storing the cropping face of person from the whole image
var canvas = document.getElementById('overlay');

// view video of the advertisement
var video1 = document.getElementById("myVideo");

 function loadTheVideo() {
    faceapi.tf.ENV.set('WEBGL_PACK', false)
    var stream = navigator.mediaDevices.getUserMedia({ video: true })

    stream.then(function (stream) {
        videoEl.srcObject = stream;
        window.setInterval(function(){onPlay(videoEl)}, 1000)
    })
}


// videoEl.addEventListener("play", function () {

//     loadTheVideo();

// });





// disable webgl
// $(document).ready(function() {
    
// }
// )

// get input video from camera


// loading the models of faceapi

        //  async function loadModels() {
// }
// loadModels();
/* loading the glasses model 
The glasses model is converted from python. 
Other future models will be loaded in the same way
*/
var model = 0
async function wait_for_load_glasses(){
    model = await tf.loadLayersModel("static/models/glasses/model.json")
    // console.log("model glassese have been loaded")
}

wait_for_load_glasses()


// resize the canvas to be of the size that we input to the model
function resizeCanvasAndResults(dimensions, canvas, results) {
    var { width, height } = dimensions instanceof HTMLVideoElement
        ? faceapi.getMediaDimensions(dimensions)
        : dimensions
    //return results.map(res => res)
    return results
};


// function to calculate the median > I use it to find the median of the age over time for one person
function median(values){
    if(values.length ===0) return 0;

    values.sort(function(a,b){
        return a-b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

function containsAll(needles, haystack){ 
    for(var i = 0 , len = needles.length; i < len; i++){
       if($.inArray(needles[i], haystack) == -1) return false;
    }
    return true;
}



function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}


// collect data 

var counter = 0
var happyCounter = 0
var normalCounter = 0


var reversecounter = 20000
var time_in_front_of_camera = 0
var total_time = 0
var age = 0
var gender = ''
var expressions = ''
var glasses = ''
var number_of_people = 0

var emotion_to_zero = 10

var average_age = [0]
var average_number_of_people = [0]
var average_gender = [0]
var average_glasses = [0]


var reset_age = true
var reset_gender = true
var reset_glasses = true
var reset_count = false
var reset_number_of_people = true
var percentageHappy = 0



var advertisements_statistics = {}

var person_statistics ={
    number_of_people : 0,
    age: '',
    gender: '',
    glasses: "glasses",
    smiling_percentage:0,
    time_in_front_of_camera: 0,
    advertisement_id: 0
}


var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
var video_id = 0

// run the smart ads 
async function onPlay(videoEl) {
    /*
     var video_conditions = [{
        "glasses":1,
        "noglasses":0,
        "male":0,
        "female":0,
        "age":0,
        "age_min":20,
        "age_max":50,
        "video_url" :"static/images/g.mp4",
        "video_id":1}]
    
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://18.188.164.175/api/client/adv/2/send-adv", true);
    xhttp.send()
*/
    //var result = await faceapi.detectSingleFace(videoEl, options).withFaceExpressions().withAgeAndGender()
    var result = await faceapi.detectAllFaces(videoEl, options).withFaceExpressions().withAgeAndGender()
    // if there is a detected face
    //console.log(result.length)
    if (result[0]) {
        document.getElementById("statistics").style.display = "none"

        reset_count = true

        // resize the image and to 96 * 96 to be used by glasses model and other models 
        // ... that I will convert from python

        var resizedResults = resizeCanvasAndResults(videoEl, canvas, result[0].detection)

        cropped_box = resizedResults.box

        dim_x = Math.round(cropped_box.x)
        dim_y = Math.round(cropped_box.y)
        dim_width = Math.round(cropped_box.width)
        dim_height = Math.round(cropped_box.height)
        var crop = {
            top :  Math.max((dim_y - 55),0),
            left : dim_x ,
            width : dim_width + 20,
            height : dim_height + 50
        }

        
        var ctx = canvas.getContext("2d");
        canvas.width = 224
        canvas.height = 224
        ctx.drawImage(videoEl, crop.left, crop.top, crop.width, crop.height, 0, 0, 224, 224);

        function preprocessImage(image) {
            let tensor = tf.browser.fromPixels(image)
                .resizeNearestNeighbor([224, 224])
                .toFloat();
            let offset = tf.scalar(127.5);
            return tensor.sub(offset)
                .div(offset)
                .expandDims();
        }
        // predict the glasses
        //glasses = model.predict(tf.browser.fromPixels(canvas).reshape([1,224,224,3])).dataSync()[0]
        glasses = model.predict(preprocessImage(canvas)).dataSync()[0]

        //console.log(glasses)
        //glasses =  glasses_dictionary[glasses]
        if (glasses > .5) {
            glasses = "glasses"
        } else if (glasses < .50001){
            glasses = "noglasses"
        }
        //const glasses_dictionary = {0:"noglasses", 1:"glasses"}


        // get median age over time for one person
        if (reset_age === true ){
            average_age = [result[0].age]
            reset_age = false
        } else {
            average_age.push(result[0].age)
        }
        age = Math.round(median(average_age))
        if (age < 15){
            age = '5-15'
        } else if (age < 25){
            age = '15-25'
        } else if (age < 37){
            age = '25-35'
        } else if (age < 45){
            age = '35-45'
        } else if (age < 55){
            age = '45-55'
        } else {
            age = '55-'
        }
        // get median age over time for one person
        if (reset_number_of_people === true ){
            average_number_of_people = [result.length]
            reset_number_of_people = false
        } else {
            average_number_of_people.push(result.length)
        }
        number_of_people = Math.round(median(average_number_of_people))


        // get gender
        if (reset_gender === true ){
            average_gender = [result[0].gender]
            reset_gender = false
            } else {
            average_gender.push(result[0].gender)
            }
        gender = mode(average_gender)

        // get glasses average
        if (reset_glasses === true ){
            average_glasses = [glasses]
            reset_glasses = false
            } else {
            average_glasses.push(glasses)
            }
        glasses = mode(average_glasses)

        // get expressions
        // get the expression with the highest probability
        var expressions = result[0].expressions
        var expressions = Object.keys(expressions).reduce(function (a, b) {
            return expressions[a] > expressions[b] ? a : b
        });


        

        // happy counter 
        document.getElementById('emotion_to_zero').innerHTML = emotion_to_zero;
        emotion_to_zero = emotion_to_zero - 1

        if (emotion_to_zero < 1){
            emotion_to_zero = 10
            happyCounter = 0
            normalCounter = 0 
        }
        // for demo set the expression and happy percentage in the statics div
        if (expressions === "happy") {
            document.getElementById("emotion").style.display = "block"
            document.getElementById('Emotion').innerHTML = "Happy";
            document.getElementById("Happy").style.color="green";
            document.getElementById("Normal").style.color="black";
            happyCounter = happyCounter + 1
            var percentageNormal = Math.round((normalCounter / (normalCounter + happyCounter ) ) * 100)
            percentageHappy = Math.round((happyCounter / (normalCounter + happyCounter )) * 100)
            document.getElementById("progressNormal").style.width = percentageNormal.toString() + "%"
            document.getElementById("progressHappy").style.width = percentageHappy.toString() + "%"
        } else  {
            document.getElementById("emotion").style.display = "none"

            document.getElementById('Emotion').innerHTML = "Normal";
            document.getElementById("Happy").style.color="black";
            document.getElementById("Normal").style.color="green";
            normalCounter = normalCounter + 1
            var percentageNormal = Math.round((normalCounter / (normalCounter + happyCounter ) ) * 100)
            percentageHappy = Math.round((happyCounter / (normalCounter + happyCounter )) * 100)
            document.getElementById("progressNormal").style.width = percentageNormal.toString() + "%"
            document.getElementById("progressHappy").style.width = percentageHappy.toString() + "%"
        }
        
        

        // for demo set the age and gender in the statics div
        document.getElementById('Age').innerHTML = age;
        document.getElementById('Gender').innerHTML = gender;
        document.getElementById('Wearing_Glasses').innerHTML = glasses;

        
       
        var stoploop = 0;
        var vc = []
        video_conditions.forEach(function (video_condition){

            // if (video_condition[age] === 1 | video_condition[glasses] === 1 |video_condition[gender] === 1){ 
            
            
            
            arr = []
            Object.keys(video_condition).forEach(function(key) {
                if (video_condition[key] == 1){ arr.push(key)}
            });
            predictions = [age, gender, glasses]

            if (!(arr.includes("male")) && !(arr.includes("female"))){
                arr.push("male")
                arr.push("female")
            }
            if (!(arr.includes("glasses")) && !(arr.includes("noglasses"))){
                arr.push("glasses")
                arr.push("noglasses")
            }
            if (!(arr.includes('5-15')) && !(arr.includes('15-25')) && !(arr.includes('25-35')) && !(arr.includes('35-45'))
             && !(arr.includes('45-55')) && !(arr.includes('55-'))){
                arr.push('5-15')
                arr.push('15-25')
                arr.push('25-35')
                arr.push('35-45')
                arr.push('45-55')
                arr.push('55-')
            }

            //console.log(predictions)
            //console.log(arr)
            if (containsAll(predictions, arr)){
                //console.log("yes")
                stoploop = 1
                vc = video_condition
                video_id = vc.video_id
                //console.log(video_id)
            }
        })

        if (stoploop === 1){
            run_video(vc)
            /*vc = []
        } else {
            console.log("return to nothing")
            if (video1.getAttribute("src") !== "static/images/img_waiting.mp4"){
                video1.setAttribute("src", "static/images/img_waiting.mp4")
                
            }
            */
        } else {
            video_id = video_id
            video_url = not_predicted_url
            //console.log("else happended")
            // console.log(video_id)
            if (video1.getAttribute("src") !== not_predicted_url){
                video1.setAttribute("src", not_predicted_url)
                }
        } 

        function run_video (video_condition){
            if (video1.getAttribute("src") != video_condition.video_url){
                video1.setAttribute("src", video_condition.video_url)
            }
            if (video_condition.video_url in advertisements_statistics){
                advertisements_statistics[video_condition.video_url] = advertisements_statistics[video_condition.video_url]
            } else {
                advertisements_statistics[video_condition.video_url] = 1
            } 
        }


        time_in_front_of_camera = time_in_front_of_camera + 1

        
        //document.getElementById('All').innerHTML = counter;
        //document.getElementById('Males').innerHTML
        //document.getElementById('Glasses').innerHTML
        //document.getElementById('Females').innerHTML
        
        //document.getElementById('Current_Viewer').innerHTML = time_in_front_of_camera  ;
        //document.getElementById('Total_times').innerHTML =  total_time + time_in_front_of_camera ;



    }
    else {
        if (reset_count === true){
            person_statistics.advertisement_id = video_id
            person_statistics.number_of_people = number_of_people
            person_statistics.age = age
            person_statistics.gender = gender
            person_statistics.glasses = glasses
            person_statistics.smiling_percentage = percentageHappy
            person_statistics.time_in_front_of_camera = time_in_front_of_camera



            // TODO add video_id
            // console.log(person_statistics)
            document.getElementById("number_of_people").innerHTML = person_statistics.number_of_people
            document.getElementById("age").innerHTML = person_statistics.age
            document.getElementById("gender").innerHTML = person_statistics.gender
            document.getElementById("smiling_percentage").innerHTML = person_statistics.smiling_percentage + '%'
            document.getElementById("time_in_front_of_camera").innerHTML = person_statistics.time_in_front_of_camera + ' secs'
            document.getElementById("statistics").style.display = "block"
            
            $.ajax({

                type:'POST',
            
                url:'https://wakeb-ads.azurewebsites.net/Adv-master/api/client/advertisement/' + screen_code + '/statistics',

                data:person_statistics,
                success:function(data){
                    // console.log(data);
                }
            });
            

            //total_time = total_time + time_in_front_of_camera
            //document.getElementById('Current_Viewer').innerHTML = 0  ;
            //document.getElementById('Total_times').innerHTML =  total_time ;

            reset_count = false
            reset_age = true
            reset_gender = true
            reset_glasses = true
            reset_number_of_people = true
            time_in_front_of_camera = 0
            video_id = 1
            // for the emotion progress
            emotion_to_zero = 0
            document.getElementById('emotion_to_zero').innerHTML = emotion_to_zero;
            document.getElementById("progressNormal").style.width =  "0%"
            document.getElementById("progressHappy").style.width = "0%"
            document.getElementById("emotion").style.display = "none"

        }

        if (video1.getAttribute("src") !== waiting_url){
            video1.setAttribute("src", waiting_url)
            }
        }
}

    
