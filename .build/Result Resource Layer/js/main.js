/*
 * DayBuddy 0.9 
 * Developed by Team GG
 * 
 * Code is rabid and will start biting if you touch or copy it without our blessing.
 */

// Clock data goes here
var canvas2;
var context;
var clockRadius;

var Events = [];  
var Event = function(x1,x2,x3,y1,y2,y3) {
this.vertx = [x1,x2,x3];
this.verty = [y1,y2,y3];
};
var isDataUpdated = false; // not used currently

var slices = {
        "percentages": [],
        "colors": []
    };
    
var activeSlice = {
        "percentages":[],
        "colors": []
    };
var activeSliceTime;

// Fader data goes here
var fader;

// Data goes here
var eventData = {};
var now = new Date().getTime(); // could potentially merge with the date object called for the clock. this one's for event data processing

// Data protocol is stored here
var SAAgent = null;
var SASocket = null;
var CHANNELID = 105;
var ProviderAppName = "DayBuddyProvider";

// Make sure animation will be working smoothly
window.requestAnimationFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function (/* function */ callback) {
    'use strict';
    window.setTimeout(callback, 1000 / 60);
};

// Initiate connection on page show and remove excess jQuery codes
$(document).on("pageshow", "[data-role='page']", function () {
	connect();
	 $('div.ui-loader').remove();
	});

$(window).ready(function(){
	//This listens for the back button press
	document.addEventListener('tizenhwkey', function(e) {
            tizen.application.getCurrentApplication().exit();
    });
	eventData.settings = JSON.parse(localStorage.getItem("calData"));
    fader = new Fader('switcher', 1);
    
    'use strict';
    canvas2 = document.createElement('canvas');
    canvas2.id = "canvas2";
    div = document.getElementById("main2"); 
    clockRadius = document.width / 2;

    //Assigns the area that will use canvas2
    canvas2.width = document.width;
    canvas2.height = canvas2.width;
    div.appendChild(canvas2);    
});

	function prepareData(log_data) {
		localStorage.setItem("calData", log_data);
		localStorage.setItem("newData", true);
		//eventData = log_string
		eventData.settings = JSON.parse(log_data);
		//creates and adds time statements to each event
		eventData.settings.table.forEach(function(obj) { 
			obj["time"] = verbalizeTime(obj.begin, obj.end); 
			obj["chartFill"] = generateTimeVisual(obj.begin, obj.end);
			});
		console.log(log_data);
		if (!isDataUpdated) updateView();
		disconnect();
	}
	function updateOldData() {
		eventData.settings = JSON.parse(localStorage.getItem("calData"));
		//creates and adds time statements to each event
		eventData.settings.table.forEach(function(obj) { 
			obj["time"] = verbalizeTime(obj.begin, obj.end); 
			obj["chartFill"] = generateTimeVisual(obj.begin, obj.end);
			});
		if (!isDataUpdated) updateView();
		console.log("Using Old Data");
	}
	
	function preparePizza() {
		var times = [];
		var pizzaSlices = [];
		slices = {
		        "percentages": [],
		        "colors": []
		    };
		    
		activeSlice = {
		        "percentages":[],
		        "colors": []
		    };		
		
		var timeNow = now;
		var activeData = [];
		// signify the current event
		eventData.settings.table.forEach(function(obj) { 
			if(obj["begin"] < now && obj["end"] > now) {
			activeData.push(obj["begin"]);
			activeData.push(obj["end"]);
			activeData.push(obj["name"]);
			}
		});
		
		if(activeData.length > 1) {
			activeSlice.colors.push("active");
			activeSlice.percentages.push(((activeData[1]-now)/(43200000))*100);
		}
		
		// debugging
		console.log(JSON.stringify(activeSlice));
		console.log(now);
		console.log(activeData[0]);
		console.log(activeData[1]);
		console.log(activeData[2]);
		
		eventData.settings.table.forEach(function(obj) { 
			if(obj["begin"] > now ) {
				if (obj["begin"] < now+43200000) {
				times.push([obj["begin"],obj["end"]]);
			}
			}
			});		
		if(times.length > 0) {
		// draws the space between now and the first event
		slices.colors.push("transparent");
		slices.percentages.push(((times[0][0]-now)/(43200000))*100);
		for (var i=0; i < times.length-1; i++ ) {
			// draws the pizza slice for the event in question
			slices.colors.push("open");
			slices.percentages.push(((times[i][1]-times[i][0])/(43200000))*100);
			// draws the space between the event in question and the succeeding event
			slices.colors.push("transparent");
			slices.percentages.push(((times[i+1][0]-times[i][1])/(43200000))*100);
		}

		console.log(times);
		console.log(JSON.stringify(slices));
		
		}
	    window.requestAnimationFrame(watch);

	}
	
	function updateView() {
		document.getElementById("main").innerHTML = "<textarea id='eventTemplate' style='display:none'>{#foreach $T.table as record}<li class='als-item' style='width: 320px; height: 320px;'><div class='content_name'><p1>{$T.record.name}</p1></div><div class='content_place'><p>{$T.record.location}</p></div><div class='content_time'><p id='timeText'>{$T.record.time}</p></div></li>{#/for}</textarea><div class='als-container' id='events' data-percent='" + eventData.settings.table[0].chartFill + "'><div class='als-viewport' onclick='fader.setTarget(1);'><ul class='als-wrapper' id='eventLoader'></ul></div></div>";
		// attach the template
		$("#eventLoader").setTemplateElement("eventTemplate");
			
		// process the template
		$("#eventLoader").processTemplate(eventData.settings);
		
		// initiate the scrolling function
	    $("#events").als({
	    	visible_items: 1,
	    	scrolling_items: 1,
	    	orientation: "horizontal",
	    	circular: "no",
	    	autoscroll: "no"
	    });
	    
	    // prepares the delicious pizza	    
	    preparePizza();
	    
	    // create the outer circle
	    chart = new EasyPieChart(document.querySelector('.als-container'), options);

	    // adjusts font sizes
	    adjustFontSizes();

	}
	
	function adjustFontSizes() {
	    // No clue why the loop below doesn't work without these two lines being processed... One of life's many mysteries...
	    var un = $(".switcher .main .als-container .als-viewport .als-wrapper #als-item_1_0 .content_name");
	    console.log(un.html().length);	  
		// Adjust font sizes accordingly for each event page	    
	    var len_fit = 15;
	    for(var i = 0; i < eventData.settings.table.length; i++) {
			var un1 = $(".switcher .main .als-container .als-viewport .als-wrapper #als-item_1_" + i + " .content_name");
			var un2 = $(".switcher .main .als-container .als-viewport .als-wrapper #als-item_1_" + i + " .content_place");
			 $(function() {
		        // Get the length of the text.
		        var len_text = un1.html().length;
		        var size_now = parseInt(un1.css("font-size"));
		        var size_new;
		        console.log(len_text);
	            // Calculate the new font size.
		        if(len_fit < len_text ){
		        	if (len_text > 45) {
		        		size_new = size_now * len_fit/(len_text-15);
		        	} else {
		        		size_new = size_now * len_fit/len_text;
		        	}
			        

		            // Set the new font size
		            if(size_new < 27) un1.css("font-size",size_new + "pt"); 
		        }
		    });
			$(function() {	
		        // Get the length of the text.
		        var len_text = un2.html().length;
		        var size_now = parseInt(un2.css("font-size"));
		        var size_new;
	            // Calculate the new font size.
		        if(len_fit < len_text ){
		        	if (len_text > 45) {
		        		size_new = size_now * len_fit/(len_text-14);
		        	} else size_new = size_now * len_fit/(len_text+2);
		
		            // Set the new font size to the text.
		            if(size_new < 27) un2.css("font-size",size_new + "pt"); 
		        }
		    });

		};
	}
	
	function onerror(err) {
		console.log("err [" + err.name + "] msg[" + err.message + "]");
		updateOldData();
	}
	
	var agentCallback = {
			onconnect : function(socket) {
				SASocket = socket;
//		alert("Connection established with RemotePeer");
				console.log("startConnection");
				SASocket.setSocketStatusListener(function(reason){
					console.log("Service connection lost, Reason : [" + reason + "]");
					disconnect();
				});
				SASocket.setDataReceiveListener(onreceive); // starts listening
				fetch();
			},
			onerror : onerror
		};
	
	var peerAgentFindCallback = {
			onpeeragentfound : function(peerAgent) {
				try {
					if (peerAgent.appName === ProviderAppName) {
						SAAgent.setServiceConnectionListener(agentCallback);
						SAAgent.requestServiceConnection(peerAgent);
					} else {
						alert("Not expected app!! : " + peerAgent.appName);
					}
				} catch(err) {
					console.log("exception [" + err.name + "] msg[" + err.message + "]");
				}
			},
			onerror : onerror
		}
	
	function onsuccess(agents) {
		try {
			if (agents.length > 0) {
				SAAgent = agents[0];
				
				SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
				SAAgent.findPeerAgents();
			} else {
				alert("Not found SAAgent!!");
			}
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
	}
	
	function connect() {
		if (SASocket) {
			alert('Already connected!');
	        return false;
	    }
		try {
			webapis.sa.requestSAAgent(onsuccess, onerror);
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
		
	}

	function disconnect() {
		try {
			if (SASocket != null) {
				SASocket.close();
				SASocket = null;
				console.log("closeConnection");
			}
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
	}
	
	
	function fetch() {
		try {
			SASocket.setDataReceiveListener(onreceive);
			SASocket.sendData(CHANNELID, "Connected To Gear!");
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
	}
	
	function generateTimeVisual(begin,end) {
		try {
			if (now < end) {
				if (now>begin) {
					return (100-((end-now)*100)/(end-begin));
				} else {
					return 0;
				}
			} else {
				return 100;
			}
		} catch(err) {
			console.log("Error in date formats when trying to generateTimeVisual.");
		}		
	}
	
	//ToDo: Maybe add AllDay distinction? Hardly anyone uses that format anyway.
	function verbalizeTime(begin,end) {
		try {
			if (now < end) {
				if (now>begin) {
					if (((end-now)/(1000*60*60)) < 1) {
						// think about verbal descriptor - positive connotation
						if (parseInt((((end-now)/(1000*60)))) === 1) {
							return "ends in " + parseInt((((end-now)/(1000*60)))) + " min";
						} else {
						return "ends in " + parseInt((((end-now)/(1000*60)))) + " mins";
						}
					} else {
						if (parseInt((((end-now)/(1000*60*60)))) === 1) {
							return "ends in " + parseInt((((end-now)/(1000*60)))) + " mins";
						} else {
							return "ends in " + parseInt((((end-now)/(1000*60*60)))) + " mins";
						}
					}
				} else {
					if (((begin-now)/(1000*60*60)) < 1) {
						if (parseInt((((begin-now)/(1000*60)))) === 1) {
							return "starts in " + parseInt((((begin-now)/(1000*60)))) + " min";
						} else {						
						return "starts in " + parseInt((((begin-now)/(1000*60)))) + " mins";
						}
					} else if (((begin-now)/(1000*60*60*24)) < 1){
						if (parseInt((((begin-now)/(1000*60*60)))) === 1) {
							return "starts in " + +(((begin-now)/(1000*60*60))).toFixed(1) + " hours";
						} else {
							return "starts in " + parseInt((((begin-now)/(1000*60*60)))) + " hours";
						}
					} else if (((begin-now)/(1000*60*60*24)) < 2){
						return "starts tomorrow";
					} else {
						return "starts in " + parseInt((((begin-now)/(1000*60*60*24)))) + " days";
					}
				}
			} else {
				return "ended already";
			}
		} catch(err) {
			console.log("Error in date formats when trying to verbalizeTime.");
		}
	}
	
	function onreceive(channelId, data) {
		prepareData(data);
	}
	
// Pizza Section Begins Here
	function getDate() {
	    'use strict';

	    var date;
	    try {
	        date = tizen.time.getCurrentDateTime();
	    } catch (err) {
	        console.error('Error: ', err.message);
	        date = new Date();
	    }

	    return date;
	}

	function watch() {
	    'use strict';

	    //Import the current time
	    var date = getDate();
	    var hours = date.getHours();
	    var minutes = date.getMinutes();
	    var seconds = date.getSeconds();
	    var hour = hours + minutes / 60;
	    var minute = minutes + seconds / 60;
	    var milliseconds = seconds * 1000 + date.getMilliseconds();
	    var angle, dx, dy;

	    hours = hours > 12 ? hours - 12 : hours;
	    
	    function pnpoly( nvert, vertx, verty, testx, testy ) {
	        var i, j, c = false;
	        for( i = 0, j = nvert-1; i < nvert; j = i++ ) {
	            if( ( ( verty[i] > testy ) != ( verty[j] > testy ) ) &&
	                ( testx < ( vertx[j] - vertx[i] ) * ( testy - verty[i] ) / ( verty[j] - verty[i] ) + vertx[i] ) ) {
	                    c = !c;
	            }
	        }
	        return c;
	    }

	    var Pizza = {
 
                cutPizza: function (slices, id) {
 
                    var percentElements = slices.percentages;
                    var colorElements = slices.colors;
                    
                    var centerX = canvas2.width / 2;
                    var centerY = canvas2.height / 2;
                    var radius = 160;
 
                    context.beginPath();
                    var endAngle = 2 * Math.PI;
 
                    var lastAngle = (hour - 3) * (Math.PI * 2) / 12;
                    
                    for (var i = 0; i < percentElements.length; i++) {
                        var percent = percentElements[i];
                        var color = colorElements[i];
                        
                        var currentSegment = endAngle * (percent/100);
                        var currentAngle = currentSegment + lastAngle;
 
                        context.beginPath();
                        context.moveTo(centerX, centerY)
                        context.arc(centerX, centerY, radius, lastAngle, currentAngle, false);
                        context.closePath();
                        // Get pizza data
                        if (this.segmentMode === 2 && color != "transparent") {
                    var event = new Event(centerX,centerX + (radius * Math.cos(lastAngle)),centerX + (radius * Math.cos(currentAngle)),centerY,centerY + (radius * Math.sin(lastAngle)),centerY + (radius * Math.sin(currentAngle))); 
                    Events.push(event);
                    }
                    
                    lastAngle = lastAngle + currentSegment;
                    if(color === "transparent") {
                        context.fillStyle = "transparent";
                    } else {
                    if(color === "active") {
                    	if(this.segmentMode === 1) {
                    		context.fillStyle = "rgba(255, 147, 0, 0.125)";
                    	} else {
                    		context.fillStyle = "rgba(255, 147, 0, 0.25)";    
                    	}
                    } else {
                        if(this.segmentMode === 1) {
                            context.fillStyle = "rgba(255, 147, 0, 0.0625)";
                            } else {
                            context.fillStyle = "rgba(255, 147, 0, 0.125)";    
                            }          
                    	}
                    }
                    
                    context.fill();
                    context.lineWidth = 2;
                    context.strokeStyle = 'black';

                        context.stroke();
                        context.fill();
                    }
                    if (this.segmentMode === 1) {
 
                        context.beginPath();
                        context.fillStyle = 'black';
                        context.arc(centerX, centerY, radius - 90, 0, 2 * Math.PI, false);
                        context.fill();
                    }
                    if (this.segmentMode === 2) {
 
                        context.beginPath();
                        context.fillStyle = 'black';
                    context.arc(centerX, centerY, radius - 14, 0, 2 * Math.PI, false);
                    context.fill();
                    
                }

                
            }
        }	    
	    context = canvas2.getContext('2d');
	    
	    //Erases the previous time
	    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	    
        //Draws the pizza pieces finally
	    
        var currentEvent = Object.create(Pizza);
        var allEvents  = Object.create(Pizza);
        allEvents.segmentMode = 2;
        allEvents.cutPizza(slices, 'main2');
        currentEvent.segmentMode = 2;
        currentEvent.cutPizza(activeSlice, 'main2');        
        allEvents.segmentMode = 1;
        allEvents.cutPizza(slices, 'main2');
        currentEvent.segmentMode = 1;
        currentEvent.cutPizza(activeSlice, 'main2');        

	    context.save();

	    //Assigns the clock creation location in the middle of the canvas2
	    context.translate(canvas2.width / 2, canvas2.height / 2);
	    
	    //Hour needle
	    context.save();
	    angle = (hour - 3) * (Math.PI * 2) / 12; //Indicate the current time
	    context.rotate(angle);
	    context.beginPath();
	    context.lineWidth = 4;
	    context.lineJoin = 'round';
	    context.moveTo(-15, -5);
	    context.lineTo(-15, 5);
	    context.lineTo(clockRadius * 0.4, 0);
	    context.closePath();
	    context.strokeStyle = "rgba(255, 147, 0, 1)";
	    context.stroke();
	    context.restore(); //Initialize state

	    //Minute needle
	    context.save();
	    angle = (minute - 15) * (Math.PI * 2) / 60;
	    context.rotate(angle);
	    context.beginPath();
	    context.moveTo(-15, -4);
	    context.lineTo(-15, 4);
	    context.lineTo(clockRadius * 0.7, 1);
	    context.lineTo(clockRadius * 0.7, -1);
	    context.fillStyle = "rgba(255, 147, 0, 1)";
	    context.fill();
	    context.restore();
        var imageObj = new Image();
        imageObj.onload = function () {
            context.drawImage(imageObj, 0,0,320,320);
    };                        

        imageObj.src = "css/arrows.png";

	    context.restore();   
	}
