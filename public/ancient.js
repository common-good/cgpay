/**
 * Test for ability to control the camera -- one of the oldest JS features and crucial for CGPay.
 * Without this script, some devices (such as old iPads) show a blank screen.
 * Note that we use here both old (<font>) and new (<style>) formatting.
 */
console.log(navigator)
if (!(navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)) document.write(
  '<style>h1 {font-size:24px; color:darkblue;} p {font-size:15px;}</style>'
  + '<br><br><br><br><br>'
  + '<center><font size="24px" color="darkblue" face="Arial"><h1>I am so sorry.</h1></font></center><br>'
  + '<center><font size="15px" color="black" face="Arial"><p>The CGPay app will not work on this device.</p></font></center>'
);
