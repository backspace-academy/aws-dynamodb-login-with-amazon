// Self-invoking anonymous function
(function($) {
	'use strict';

	// Region must be defined
	AWS.config.region = 'us-east-1';
	// Insert your IAM role arn here
	var roleArn = 'YOUR-ROLE-ARN-GOES-HERE';
	
	var userLoggedIn = false;
	var accessToken, userProfile, dynamodb;
	
	// Click event listeners for buttons
	$('#LoginWithAmazon').click(function() {
	  	loginWithAmazon();
	});
	$('#Logout').click(function() {
		logoutAWS();
		amazon.Login.logout();
	});
	$('#writeDB').click(function() {
		writeDynamoDB();
	});	

	//Login with Amazon code
	function loginWithAmazon(){
		var options = {};
		options.scope = 'profile';
		// Get access token
		amazon.Login.authorize(options, function(response) {
			if ( response.error ) {
				alert('oauth error ' + response.error);
				return;
			}
			console.log('Amazon Login Details:');
			console.log(JSON.stringify(response));
			accessToken  = response.access_token;
			// Get user profile
			amazon.Login.retrieveProfile(response.access_token, function(response) {
				userProfile = response.profile;
				console.log('Amazon Profile Details:');
				console.log(JSON.stringify(userProfile));
				createCredentials(accessToken, response);
			});
		});
		return false;
	}

	//Set up AWS Credentials
	function createCredentials(accessToken) {
		console.log('Creating AWS Credentials for:');
		console.log('Role: ' + roleArn);
		console.log('Access Token: ' + accessToken);
  		AWS.config.credentials = new AWS.WebIdentityCredentials({
      		ProviderId: 'www.amazon.com',
      		RoleArn: roleArn,
      		WebIdentityToken: accessToken
  		});
		
		//refreshes credentials
		AWS.config.credentials.refresh((error) => {
			if (error) {
				console.error(error);
				alert('Unable to sign in. Please try again.');
			} else {
				// Instantiate aws sdk service objects now that the credentials have been updated.
				dynamodb = new AWS.DynamoDB();
				userLoggedIn = true;
				console.log('Successfully created AWS STS temporary credentials!');
				alert('You are now signed in.');
							}
		});
	}

	//Write to DynamoDB code
	function writeDynamoDB(){
		if (userLoggedIn){
			console.log('Writing to DynamoDB for CutomerID:');
			console.log(JSON.stringify(userProfile.CustomerId));
 			var params = {
  				Item: {
   					'CustomerId': {
						S: userProfile.CustomerId
					}, 
					'Email': {
						S: userProfile.PrimaryEmail
					},
					'Name': {
						S: userProfile.Name
					},
					'TopScore': {
						N: '0'
					}
				},
				ReturnConsumedCapacity: 'TOTAL', 
				TableName: 'login-with-amazon-test'
			};
			dynamodb.putItem(params, function(err, data) {
   				if (err) {
					console.log(err, err.stack); // an error occurred
				}
   				else{
					console.log(JSON.stringify(data));           // successful response
				}
 			});
		}
		else {
			alert('You are not logged in!');
		}
		return false;
	}

	//Logout code
	function logoutAWS(){
		if (userLoggedIn){
			console.log('Revoking AWS credentials');
		}
		else {
			alert('You are not logged in!');
		}
		return false;			
	}

	// End 	self-invoking anonymous function
})(jQuery);
