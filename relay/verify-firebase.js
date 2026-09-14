import { GoogleAuth } from 'google-auth-library';
try {
 const auth=new GoogleAuth({keyFilename:'/etc/anna-relay/firebase-key.json',scopes:['https://www.googleapis.com/auth/firebase.messaging']});
 const token=await auth.getAccessToken();
 if(!token)throw new Error('No access token');
 console.log('Firebase service-account OAuth exchange succeeded; token suppressed.');
} catch { console.error('Firebase service-account authentication failed; details suppressed.'); process.exitCode=1; }
