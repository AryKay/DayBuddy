/*
 * DayBuddy 0.9
 * Developed and Designed by Team GG
 * 
 * Code is rabid and will start biting if you touch or copy it without our blessing.
 */

var fader = new Fader('switcher');

// In this guy's settings 
var eventData = {};
var now = new Date().getTime();

var SAAgent = null;
var SASocket = null;
var CHANNELID = 105;
var ProviderAppName = "DayBuddyProvider";


$(document).on("pageshow", "[data-role='page']", function () {
	connect();
	 $('div.ui-loader').remove();
	});

$(window).load(function(){
	//This listens for the back button press
	document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName === "back")
            tizen.application.getCurrentApplication().exit();
    });
	eventData.settings = JSON.parse(localStorage.getItem("calData"));
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
		updateView();
		disconnect();
	}
	function updateOldData() {
		eventData.settings = JSON.parse(localStorage.getItem("calData"));
		//creates and adds time statements to each event
		eventData.settings.table.forEach(function(obj) { 
			obj["time"] = verbalizeTime(obj.begin, obj.end); 
			obj["chartFill"] = generateTimeVisual(obj.begin, obj.end);
			});
		updateView();
		console.log("Using Old Data");
	}
	
	function updateView() {
		document.getElementById("main").innerHTML = "<textarea id='eventTemplate' style='display:none'>{#foreach $T.table as record}<li class='als-item' style='width: 320px; height: 320px;'><div class='content_name'><p1>{$T.record.name}</p1></div><div class='content_place'><p>{$T.record.location}</p></div><div class='content_time'><p id='timeText'>{$T.record.time}</p></div></li>{#/for}</textarea><div class='als-container' id='events' data-percent='0'><div class='als-viewport'><ul class='als-wrapper' id='eventLoader'></ul></div></div>";
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
	    
	    // create the outer circle
	    chart = new EasyPieChart(document.querySelector('.als-container'), options);
	    
	    // No clue why the loop below doesn't work without these two lines being processed... One of life's many mysteries...
	    var un = $(".main .als-container .als-viewport .als-wrapper #als-item_1_0 .content_name");
	    console.log(un.html().length);	    
	    
		// Adjust font sizes accordingly for each event page	    
	    var len_fit = 17;
	    for(var i = 0; i < eventData.settings.table.length; i++) {
			var un1 = $(".main .als-container .als-viewport .als-wrapper #als-item_1_" + i + " .content_name");
			var un2 = $(".main .als-container .als-viewport .als-wrapper #als-item_1_" + i + " .content_place");
			 $(function() {
		        // Get the length of the text.
		        var len_text = un1.html().length;
		        var size_now = parseInt(un1.css("font-size"));
		        var size_new;
	            // Calculate the new font size.
		        if(len_fit < len_text ){
		        	if (len_text > 45) {
		        		size_new = size_now * len_fit/(len_text-15);
		        	} else size_new = size_now * len_fit/len_text;

		            console.log(len_text);
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
		        	} else size_new = size_now * len_fit/len_text;
		
		            // Set the new font size to the user name.
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
					return (((end-now)*100)/(end-begin));
				} else {
					return 100;
				}
			} else {
				return 0;
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
						return "" + parseInt((((end-now)/(1000*60)))) + " mins left";
					} else {
						return "" + parseInt((((end-now)/(1000*60*60)))) + " hours left";
					}
				} else {
					if (((begin-now)/(1000*60*60)) < 1) {
						return "starts in " + parseInt((((begin-now)/(1000*60)))) + " mins";
					} else {
						return "starts in " + parseInt((((begin-now)/(1000*60*60)))) + " hours";
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