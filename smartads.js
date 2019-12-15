$(document).ready(function() {
    faceapi.tf.ENV.set('WEBGL_PACK', false)
})


const videoEl = document.getElementById('inputVideo')
const canvas = document.getElementById('overlay')
var video1 = document.getElementById("myVideo");

const URL = "static/models"
loadModels = async() => {

    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(URL)
])}

        //faceapi.nets.ssdMobilenetv1.loadFromUri(URL)//,
        //,
       // faceapi.nets.ageGenderNet.loadFromUri(URL),
       // faceapi.nets.faceExpressionNet.loadFromUri(URL)

   //    <script>
    //   faceapi.loadTinyFaceDetectorModel("static/models")
   
   //    faceapi.nets.ageGenderNet.loadFromUri("static/models")
 //      faceapi.nets.ssdMobilenetv1.loadFromUri("static/models")
   
     //  faceapi.nets.faceExpressionNet.loadFromUri("static/models")
    // </script>
loadModels();



var model = 0
async function wait_for_load_glasses(){
    model = await tf.loadLayersModel("static/models/glasses/model.json")
    console.log("model glassese have been loaded")

}
wait_for_load_glasses()
    async function run() {

        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoEl.srcObject = stream;

    }
    function resizeCanvasAndResults(dimensions, canvas, results) {
        const { width, height } = dimensions instanceof HTMLVideoElement
            ? faceapi.getMediaDimensions(dimensions)
            : dimensions
        //return results.map(res => res)
        return results
    };

    function drawDetections(dimensions, canvas, results) {

    };
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
    
    async function onPlay(videoEl) {

        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
        var result = await faceapi.detectSingleFace(videoEl, options)
        
        //.withFaceExpressions().withAgeAndGender()


        if (result) {
            //console.log(result.age)
            if (ageCorrector === 1 ){
              average_age = [result.age]
              ageCorrector = 0
            } else {
              average_age.push(result.age)
              
            }
            var age1 = Math.round(median(average_age))
            gender1 = result.gender
            var ex = result.expressions
            var ex1 = Object.keys(ex).reduce((a, b) => ex[a] > ex[b] ? a : b);




            document.getElementById('emotion_to_zero').innerHTML = emotion_to_zero;
              emotion_to_zero = emotion_to_zero - 1


              if (emotion_to_zero < 1){
                  emotion_to_zero = 10
                  happyCounter = 0
                  normalCounter = 0 
              }

              document.getElementById('Age').innerHTML = age1;
              if (gender1 === "male"){
                  document.getElementById('Gender').innerHTML = "Man";
              } else if (gender1 === "female") {
              document.getElementById('Gender').innerHTML = "Woman";
              }

              if (ex1 === "neutral"){
                  document.getElementById('Emotion').innerHTML = "Normal";

                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="green";

                  normalCounter = normalCounter + 1
                  var percentageNormal = Math.round((normalCounter / (normalCounter + happyCounter ) ) * 100)
                  var percentageHappy = Math.round((happyCounter / (normalCounter + happyCounter )) * 100)

                  document.getElementById("progressNormal").style.width = percentageNormal.toString() + "%"
                  document.getElementById("progressHappy").style.width = percentageHappy.toString() + "%"


              } else if (ex1 === "happy") {
                  document.getElementById('Emotion').innerHTML = "Happy";

                  document.getElementById("Happy").style.color="green";
                  document.getElementById("Normal").style.color="black";

                  happyCounter = happyCounter + 1
                  var percentageNormal = Math.round((normalCounter / (normalCounter + happyCounter ) ) * 100)
                  var percentageHappy = Math.round((happyCounter / (normalCounter + happyCounter )) * 100)
                  document.getElementById("progressNormal").style.width = percentageNormal.toString() + "%"
                  document.getElementById("progressHappy").style.width = percentageHappy.toString() + "%"

              } else if (ex1 === "sad") {
                  document.getElementById('Emotion').innerHTML = "Sad";

                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="black";
              }else if (ex1 === "angry") {
                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="black";
              }else if (ex1 === "fearful") {
                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="black";
              }else if (ex1 === "disgusted") {
                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="black";
              }else if (ex1 === "surprised") {
                  document.getElementById("Happy").style.color="black";
                  document.getElementById("Normal").style.color="black";
              }

      





            if (run_every_other_time === 1){

              const resizedResults = resizeCanvasAndResults(videoEl, canvas, result.detection)

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
          
              canvas.width = 96
              canvas.height = 96
              ctx.drawImage(videoEl, crop.left, crop.top, crop.width, crop.height, 0, 0, 96, 96);


              //const example = tf.browser.fromPixels(videoEl);  // for example

              //const prediction = model.predict(example);
              //console.log(prediction)
              
              if (video1.getAttribute("src") === "static/images/m.mp4"){
                current_video = "man"
            } else if (video1.getAttribute("src") === "static/images/w.mp4") {
                current_video = "woman"
            } else if (video1.getAttribute("src") === "static/images/g.mp4") {
                current_video = "glasses"
            } 
            glassesp = model.predict(tf.browser.fromPixels(canvas).reshape([1,96,96,3])).dataSync()[0]
              if (glassesp === 1){
                  if (current_video != "glasses"){
                      document.getElementById('Wearing_Glasses').innerHTML = "Wearing glasses";
                      video1.setAttribute("src", "static/images/g.mp4")
                      Glasses_Ads = Glasses_Ads + 1
                      document.getElementById('Glasses_Ads').innerHTML = Glasses_Ads;
                  }
              } else if (glassesp === 0){
                  document.getElementById('Wearing_Glasses').innerHTML = "No glasses";
                  if (gender1 === "male"){
                      if (current_video != "man"){
                          Males_Ads = Males_Ads + 1
                          document.getElementById('Males_Ads').innerHTML = Males_Ads;
                          video1.setAttribute("src", "static/images/m.mp4")
                      }
                  } else if (gender1 === "female"){
                      if (current_video != "woman"){
                          video1.setAttribute("src", "static/images/w.mp4")

                          Females_Ads = Females_Ads + 1
                          document.getElementById('Females_Ads').innerHTML = Females_Ads;
                      }
                  }
                }

              
              run_every_other_time = 0
            } else {
                run_every_other_time = 1
            }


            if (reversecounter > 0 && glassesp != ''){

              counter = counter + 1
              document.getElementById('All').innerHTML = counter;
              console.log("a new person passed by ")

              if (gender1 === "male" && glassesp === 1){

                  countermanglasses = countermanglasses + 1
                  document.getElementById('Males').innerHTML = countermanglasses + countermannoglasses;
                  document.getElementById('Glasses').innerHTML = countermanglasses + counterwomanglasses;
              } else if (gender1 === "female" && glassesp === 1) {

                  counterwomanglasses = counterwomanglasses + 1
                  document.getElementById('Females').innerHTML = counterwomanglasses + counterwomannoglasses;
                  document.getElementById('Glasses').innerHTML = countermanglasses + counterwomanglasses;
              } else if (gender1 === "male" && glassesp === 0) {

                  countermannoglasses = countermannoglasses + 1
                  document.getElementById('Males').innerHTML = countermanglasses + countermannoglasses;
              } else if (gender1 === "female" && glassesp === 0) {

                  counterwomannoglasses = counterwomannoglasses + 1
                  document.getElementById('Females').innerHTML = counterwomanglasses + counterwomannoglasses;
              }


            }
            time_in_front_of_camera = time_in_front_of_camera + 1
            document.getElementById('Current_Viewer').innerHTML = time_in_front_of_camera  ;
            document.getElementById('Total_times').innerHTML =  total_time + time_in_front_of_camera ;


            if (glassesp != ''){
              reversecounter = 0
            }
            reverse_time_in_front_of_camera = 0
            

        }
        else {
            ageCorrector = 1
            emotion_to_zero = 0
            document.getElementById('emotion_to_zero').innerHTML = emotion_to_zero;
            document.getElementById("progressNormal").style.width =  "0%"
            document.getElementById("progressHappy").style.width = "0%"


            current_video = "" 
            if (video1.getAttribute("src") !== "static/images/img_waiting.mp4"){
                video1.setAttribute("src", "static/images/img_waiting.mp4")
             }
            reversecounter = reversecounter + 1

            reverse_time_in_front_of_camera = reverse_time_in_front_of_camera + 1
            if (reverse_time_in_front_of_camera > 0 && time_in_front_of_camera > 0){
                  console.log("time spent by last person was: ")
                  console.log(time_in_front_of_camera)
                  total_time = total_time + time_in_front_of_camera
                  time_in_front_of_camera = 0
                  reverse_time_in_front_of_camera = 0
                  document.getElementById('Current_Viewer').innerHTML = 0  ;
                  document.getElementById('Total_times').innerHTML =  total_time ;
                  

              }
              
              }
          //console.log(ageCorrector)
          //console.log(age1)
          //console.log(average_age)
    }

    document.getElementById("snap").addEventListener("click", function() {
        run()
    });
    var counter = 0
    var happyCounter = 0
    var normalCounter = 0
    var sadCounter = 0
    var countermanglasses = 0
    var countermannoglasses = 0
    var counterwomanglasses = 0
    var counterwomannoglasses = 0
    var reversecounter = 20000
    var time_in_front_of_camera = 0
    var total_time = 0
    var reverse_time_in_front_of_camera = 0
    var gender1 = ''
    var glassesp = ''
    var sadzone = 0
    var emotion_to_zero = 10
    var Males_Ads = 0
    var Females_Ads = 0
    var Glasses_Ads = 0
    var average_age = [0]
    var ageCorrector = 1
    run_every_other_time = 1
    document.getElementById("play").addEventListener("click", function() {
      window.setInterval(function(){onPlay(videoEl)}, 1000);
    });
    var current_video = ""

    function send_canvas_ctx(age1,gender1,ex1) {
  


        }