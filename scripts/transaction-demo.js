function onPageLoad(){

	var tokenId;
	//Set defaults
	document.getElementById("tokenId").innerHTML='<span class="redText">---</span>';
	document.getElementById("sessionExpiration").innerHTML='<span class="redText">---</span>'
	document.getElementById("tokenUser").innerHTML='<span class="redText">---</span>';
	document.getElementById("units").innerHTML='500';


}

function login() {

	var data = JSON.stringify({});

	submittedUsername=document.getElementById("userName").value;
	submittedPassword=document.getElementById("password").value;

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	    console.log(this.responseText);
	  }
	});

	xhr.open("POST", "/openam/json/authenticate");
	xhr.setRequestHeader("x-openam-username", submittedUsername);
	xhr.setRequestHeader("x-openam-password", submittedPassword);
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);

	//Wait until the request has completed then ping response back to the ui
	xhr.onreadystatechange = function () {
	    var DONE = this.DONE || 4;
	    if (this.readyState === DONE){
	    	
	    	//console.log(xhr.responseText())
	    	//Strip out tokenId and store and update the UI
	    	if(JSON.parse(this.responseText).tokenId){

	    		tokenId=JSON.parse(this.responseText).tokenId;
	    		//Send tokenId back to the UI
	    		document.getElementById("tokenId").innerHTML='<span class="greenText">' + tokenId + '</span>'
	    		//Update Session Expiration
	    		checkSession(tokenId);

	    	} else {

	    		document.getElementById("tokenId").innerHTML='<span class="redText">' + this.responseText + '</span>'	

	    	}

	    		//Flush out the submitted fields
			document.getElementById("userName").value="";
			document.getElementById("password").value="";
	    	
	    }
	}


}

//Utility function from https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkSession(tokenId) {

	
	var data = JSON.stringify({});
	
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	    console.log(this.responseText);
	  }
	});


	xhr.open("POST", "/openam/json/sessions?tokenId=" + tokenId +"&_action=getSessionInfo");
	xhr.setRequestHeader("iPlanetDirectoryPro", tokenId);
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);

	//Wait until the request has completed then ping response back to the ui
	xhr.onreadystatechange = function () {
	    var DONE = this.DONE || 4;
	    if (this.readyState === DONE){
	    	
	    	//Strip out session expiration and username and update the UI
	    	if(JSON.parse(this.responseText).maxIdleExpirationTime){

	    		//Pull out the expiration time and update in the UI
	    		document.getElementById("sessionExpiration").innerHTML='<span class="greenText">' + JSON.parse(this.responseText).maxIdleExpirationTime + '</span>';	
	    		//Pull out the user associated with the cookie
	    		document.getElementById("tokenUser").innerHTML='<span class="greenText">' + JSON.parse(this.responseText).username + '</span>';
	    		//Enable process button
	    		document.getElementById("processButton").disabled=false;

	    	} else {

	    		document.getElementById("sessionExpiration").innerHTML="Invalid Token"
	    		document.getElementById("tokenUser").innerHTML="Not Set"	

	    	}
	    	
	    }
	}

	

}

//Does REST calls for PDP eval
function process(){

	transferAmount=document.getElementById("transferAmount").value;

	if ( transferAmount > 50) {

		processSecureTransfer(transferAmount);

	} else {

		processStandardTransfer(transferAmount);
	}
	
	
}

function processStandardTransfer(units){

	data=("{\"resources\": [\"standardTransfer://" + units +"\"],\"application\":\"TransactionApp\"}");

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	    console.log(this.responseText);
	  }
	});


	xhr.open("POST", "/openam/json/policies?_action=evaluate");
	xhr.setRequestHeader("iPlanetDirectoryPro", getCookie("iPlanetDirectoryPro"));
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);

	//Wait until the request has completed then ping response back to the ui
	xhr.onreadystatechange = function () {
	    var DONE = this.DONE || 4;
	    if (this.readyState === DONE){
	    	
	    	//If PDP returns actions.transfer==true
	    	if(JSON.parse(this.responseText)[0].actions.transfer==true){

	    		//Pull out the PDP response
	    		document.getElementById("transactionPDPResponse").innerHTML='<span class="greenText">Transfer Allowed</span>';	
	    		document.getElementById("units").innerHTML= (document.getElementById("units").innerHTML) - units;

	    	} else {

	    		document.getElementById("transactionPDPResponse").innerHTML='<span class="redText">Transfer Denied</span>';		

	    	}
	    
	    }


	}

}
//Sends composite advice
function sendCompositeRequest2(transactionId, data){

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	    console.log(this.responseText);

	    document.getElementById("transactionPDPResponse").innerHTML=this.responseText;

	  }
	});


	xhr.open("POST", "/openam/json/authenticate?authIndexType=composite_advice&authIndexValue=%3CAdvices%3E%0A%3CAttributeValuePair%3E%0A%3CAttribute%20name%3D%22TransactionConditionAdvice%22%2F%3E%0A%3CValue%3E"+transactionId+"%3C%2FValue%3E%0A%3C%2FAttributeValuePair%3E%0A%3C%2FAdvices%3E");
	xhr.setRequestHeader("iPlanetDirectoryPro", getCookie("iPlanetDirectoryPro"));
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);


}



//Sends composite advice
function sendCompositeRequest1(transactionId){

	//Allows passing of the received data payload, first time run through this isn't needed so we default to empty object
	data = ("{}");
		
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {

		    console.log(this.responseText);

			document.getElementById("transactionPDPResponse").innerHTML="Push Sent";

		    //Pull out response
		    data=this.responseText;

		    //10 sec time out before sending second request
		    document.setTimeout(sendCompositeRequest2,10000, transactionId, data);

	  }
	});


	xhr.open("POST", "/openam/json/authenticate?authIndexType=composite_advice&authIndexValue=%3CAdvices%3E%0A%3CAttributeValuePair%3E%0A%3CAttribute%20name%3D%22TransactionConditionAdvice%22%2F%3E%0A%3CValue%3E"+transactionId+"%3C%2FValue%3E%0A%3C%2FAttributeValuePair%3E%0A%3C%2FAdvices%3E");
	xhr.setRequestHeader("iPlanetDirectoryPro", getCookie("iPlanetDirectoryPro"));
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);

}



function processSecureTransfer(units) {


	data=("{\"resources\": [\"secureTransfer://" + units +"\"],\"application\":\"TransactionApp\"}");
		
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
	  if (this.readyState === 4) {
	    console.log(this.responseText);
	  }
	});


	xhr.open("POST", "/openam/json/policies?_action=evaluate");
	xhr.setRequestHeader("iPlanetDirectoryPro", getCookie("iPlanetDirectoryPro"));
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("cache-control", "no-cache");

	xhr.send(data);

	//Wait until the request has completed then ping response back to the ui
	xhr.onreadystatechange = function () {
	    var DONE = this.DONE || 4;
	    if (this.readyState === DONE){
	    	
	    	//Check for presence of transaction Id from the policy response
	    	if(JSON.parse(this.responseText)[0].advices.TransactionConditionAdvice[0]){

	    		transactionId=JSON.parse(this.responseText)[0].advices.TransactionConditionAdvice[0];

	    		//Send transactionId over to the ../json/authenticate endpoint with compositve
	    		sendCompositeRequest1(transactionId)

	    		
	    	} else {

	    		document.getElementById("transactionPDPResponse").innerHTML='<span class="redText">Transfer Denied</span>';		

	    	}
	    }
	}
}






//Logs user out, remove's cookie kills server side session
function logout(userName){
	
	//Create a basic HTTP request..
	var xhr = new XMLHttpRequest();
	
	//Send a post to the /pairNotification endpoint with the deviceCode that was collected on the initial page render
	xhr.open('POST', '/logout', true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.send(JSON.stringify({userName: userName}));
	
	//Wait until the request has completed then ping response back to the ui
	xhr.onreadystatechange = function () {
	    var DONE = this.DONE || 4;
	    if (this.readyState === DONE){
	    	
	    	window.location="/"; //redirect back to index
	    }
	}
}