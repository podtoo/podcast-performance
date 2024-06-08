import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { resolveTripleslashReference } from 'typescript';
const fs = require('fs');
const mustache = require('mustache');
const path = require('path');

interface AcceptActivity {
    "@context": string;
    id: string;
    type: string;
    actor: string;
    object: any;
    signature?: {
      type: string;
      creator: string;
      created: string;
      signatureValue: string;
    };
  }


const router = Router();

type DataItem = {
    time: number;
    event: string;
  };
  
  type EpisodeData = {
    time: number;
    percentage: number;
  };
  
  type Result = {
    guid: string;
    duration:number;
    data: EpisodeData[];
  };





// Define the route with the dynamic username parameter
router.get('/:username', async (req, res) => {
  const username = req.params.username;
  const user = await req.db.findUser({ "username": username });


  if (req.headers.accept && req.headers.accept.includes('activity+json')) {
    
    console.log('mastodon ran this code');
      // Load the JSON template
      const template = fs.readFileSync(path.join(__dirname, '../../utils/core/json/users/person.json'), 'utf8');
      res.setHeader('Content-Type', 'application/activity+json');
      // Example data, replace this with actual data fetching logic
      const data = {
        serverDomain: "podcastperformance.com",
        username: username,
        name: user.name,
        type:user.type,
        createdAt: user.createAt,
        publicKey: user.publicKey,
        iconPic: {
            type: user.iconPic.type,
            url: user.iconPic.url,
        },
        imagePic: {
            type: "image/jpeg",
            url: "https://podcastperformance.com/media/image.jpg"
        }
    };

    // Render the template with the data
    let jsonResponse = mustache.render(template, data);
    

    // Parse the rendered template to an object
    jsonResponse = JSON.parse(jsonResponse);

    // Add the icon and image if they exist
    if (data.iconPic && data.iconPic.type && data.iconPic.url) {
        jsonResponse.icon = {
            type: "Image",
            mediaType: data.iconPic.type,
            url: data.iconPic.url
        };
    }

    if (data.imagePic && data.imagePic.type && data.imagePic.url) {
        jsonResponse.image = {
            type: "Image",
            mediaType: data.imagePic.type,
            url: data.imagePic.url
        };
    }
    // Create the ActivityPub profile response
   // Create the ActivityPub profile response
   const profileResponse = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `https://podcastperformance.com/users/${username}`,
        "type": user.type,
        "preferredUsername": username,
        "inbox": `https://podcastperformance.com/users/${username}/inbox`,
        "outbox": `https://podcastperformance.com/users/${username}/outbox`,
        "followers": `https://podcastperformance.com/users/${username}/followers`,
        "following": `https://podcastperformance.com/users/${username}/following`,
        "manuallyApprovesFollowers": false,
        "publicKey": user.publicKey, // Use the publicKey field directly from the user document
        "icon": {
            "type": "Image",
            "mediaType": user.iconPic.type,
            "url": user.iconPic.url // Update with actual avatar URL
        }
    };


    res.setHeader('Content-Type', 'application/activity+json');
  
    // Send the JSON response
    return res.json(profileResponse);
  } else {
      // Otherwise, render an EJS template
      res.render('users/home', { username });
  }
});

router.get('/:username/followers', async (req, res) => {
    const username = req.params.username;
    const page = Number(req.query.page);
    const user = await req.db.findUser({ "username": username });
  
  
    if (req.headers.accept && req.headers.accept.includes('activity+json')) {
      
      console.log('mastodon ran this code');
        // Load the JSON template
        res.setHeader('Content-Type', 'application/activity+json');
        // Example data, replace this with actual data fetching logic
     
    if(!page){
  
     
      // Create the ActivityPub profile response
     // Create the ActivityPub profile response

     //"totalItems":0,"first":"https://mastodon.social/users/DRN1LIVE/followers?page=1"}
     const profileResponse = {
          "@context": "https://www.w3.org/ns/activitystreams",
          "id": `https://podcastperformance.com/users/${username}/followers`,
          "type": 'OrderedCollection',
          "totalItems": user.followers.length,
          "first":`https://podcastperformance.com/users/${username}/followers?page=1`,
      };
  
  
      res.setHeader('Content-Type', 'application/activity+json');
    
      // Send the JSON response
      return res.json(profileResponse);

    }
    else
    {
        //{"@context":"https://www.w3.org/ns/activitystreams","id":"https://podcastindex.social/users/russell/followers?page=1","type":"OrderedCollectionPage","totalItems":17,"next":"https://podcastindex.social/users/russell/followers?page=2","partOf":"https://podcastindex.social/users/russell/followers","orderedItems":["https://mastodon.social/users/DRN1LIVE","https://mastodon.social/users/fedidevs","https://podcastindex.social/users/steven","https://podcastindex.social/users/silas","https://planetrage.social/users/Darren","https://mk.spook.social/users/9iv951r6uj","https://masto.es/users/ruisan","https://activitypub.agates.io/users/agates","https://podcastindex.social/users/Kolomona","https://podcastindex.social/users/Meremortals","https://mastodon.scot/users/scottishlass","https://podcastindex.social/users/StevenB"]}

        const profileResponse = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `https://podcastperformance.com/users/${username}/followers?page=${page}`,
            "type": 'OrderedCollectionPage',
            "totalItems": user.followers.length,
            "next": `https://podcastperformance.com/users/${username}/followers?page=${page+1}`,
            "partOf":`https://podcastperformance.com/users/${username}/followers`,
            "orderedItems":user.followers
        };


      res.setHeader('Content-Type', 'application/activity+json');
    
      // Send the JSON response
      return res.json(profileResponse);

    }
    } else {
        // Otherwise, render an EJS template
        res.render('users/home', { username });
    }
  });

router.post('/:username/inbox', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.params.username;
     
        const activity = req.body;
        console.log(activity)
        // Fetch user information from the database to ensure user exists
        const user = await req.db.findUser({ 'username': username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Process different types of activities
        switch (activity.type) {
            case 'Create':
                console.log(`CREATE - ${JSON.stringify(activity)}`);
                await handleCreateActivity(req.db, user, activity);
                break;
            case 'Follow':
                console.log(`Follow - ${JSON.stringify(activity)}`);
  
                await handleFollowActivity(req.db, user, activity);
                return res.status(200).json(
                { message: 'Follow request accepted and processing' })
                
                break;
            case 'Like':
                console.log(`Like - ${JSON.stringify(activity)}`);
               // await handleLikeActivity(req.db, user, activity);
                break;
            case 'Announce':
                console.log(`Announce - ${JSON.stringify(activity)}`);
                //await handleAnnounceActivity(req.db, user, activity);
                break;
            case 'Update':
                console.log(`Update - ${JSON.stringify(activity)}`);
                await handleUpdateActivity(req.db, user, activity);
                break;
            case 'Undo':
                console.log(`Undo - ${JSON.stringify(activity)}`);
                await handleUndoActivity(req.db, user, activity);
                break;
            default:
                console.log('Unhandled activity type:', activity.type, JSON.stringify(activity));
        }

        res.status(202).send('Accepted');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/:username/outbox', async  (req: Request, res: Response, next: NextFunction) => {
    //This is a users outbox that checks for outbound messages.

})

export default router;

async function handleCreateActivity(db:any, user:any, activity:any) {
    const baseNote = {
        type: activity.object.type,
        externalId: activity.object.id,
        actor: activity.actor,
        atomUri: activity.object.atomUri,
        conversation: activity.object.conversation,
        content: activity.object.content,
        published: activity.object.published,
        to: activity.object.to,
        cc: activity.object.cc,
        replies: activity.object.replies,
        likes: [],
        tag: activity.object.type,
        urls: activity.object.urls,
        signature: activity.signature,
        userId: user._id  // link to internal user
    };

    // Add additional fields based on the type of activity
    let additionalFields = {};

    if (activity.object.type === 'Question') {
        additionalFields = {
            endTime: activity.object.endTime,
            votersCount: activity.object.votersCount,
            oneOf: activity.object.oneOf
        };
    }

    // Add the attachment field only if it exists
    if (activity.object.attachment) {
        additionalFields = {
            ...additionalFields,
            attachment: activity.object.attachment
        };
    }

    // Add the attachment field only if it exists
    if (activity.object.contentMap) {
        additionalFields = {
            ...additionalFields,
            contentMap: activity.object.contentMap
        };
    }
    
    const note = { ...baseNote, ...additionalFields };
    await db.insertActivity(note);
}


async function handleUpdateActivity(db: any, user: any, activity: any) {
    const baseNote = {
        type: activity.object.type,
        actor: activity.actor,
        atomUri: activity.object.atomUri,
        conversation: activity.object.conversation,
        content: activity.object.content,
        published: activity.object.published,
        to: activity.object.to,
        cc: activity.object.cc,
        replies: activity.object.replies,
        likes: [],
        tag: activity.object.type,
        urls: activity.object.urls,
        signature: activity.signature,
        userId: user._id  // link to internal user
    };

    // Add additional fields based on the type of activity
    let additionalFields = {};

    if (activity.object.type === 'Question') {
        additionalFields = {
            endTime: activity.object.endTime,
            votersCount: activity.object.votersCount,
            oneOf: activity.object.oneOf
        };
    }

    // Add the attachment field only if it exists
    if (activity.object.attachment) {
        additionalFields = {
            ...additionalFields,
            attachment: activity.object.attachment
        };
    }

    // Add the contentMap field only if it exists
    if (activity.object.contentMap) {
        additionalFields = {
            ...additionalFields,
            contentMap: activity.object.contentMap
        };
    }
    
    const updatedFields = { ...baseNote, ...additionalFields };

    await db.updateActivity(
        { externalId: activity.object.id },  // Filter to find the document by externalId
        updatedFields                        // Set the fields to be updated
    );
}


async function handleFollowActivity(db: any, user: any, activity: any) {
    await db.followUser(user.username, activity.actor);
  
    // Create the Accept activity
    const acceptActivity: any = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": `https://podcastperformance.com/activities/${generateUniqueId()}`,
      "type": "Accept",
      "actor": `https://podcastperformance.com/users/${user.username}`,
      "object": activity.object,
      "to": activity.actor
    };

    
    // Generate the signature
    const signatureResult = await db.generateSignature(acceptActivity, '/users/' + user.username + '/inbox', 'POST', 'podcastperformance.com');
    const { signature, date, digest } = signatureResult;
  
    // Add the signature to the Accept activity
    acceptActivity.signature = {
      type: 'RsaSignature2017',
      creator: `https://podcastperformance.com/users/${user.username}#main-key`,
      created: new Date().toISOString(),
      signatureValue: signature
    };
  
    // Send the Accept activity to the actor's inbox
    await sendActivityToInbox(activity.actor, acceptActivity, signatureResult);
  }
  

// Function to generate a unique ID for the activity
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

// Function to send an activity to an actor's inbox
async function sendActivityToInbox(actor: string, activity: AcceptActivity, signatureResult: any) {
    const inboxUrl = actor.endsWith('/') ? `${actor}inbox` : `${actor}/inbox`;
    const body = JSON.stringify(activity);
    const { signature, date, digest } = signatureResult;
    const host = new URL(inboxUrl).host;
  
    // Construct the curl command
    const curlCommand = `curl -X POST ${inboxUrl} \\
      -H "Content-Type: application/activity+json" \\
      -H "Date: ${date}" \\
      -H "Digest: SHA-256=${digest}" \\
      -H 'Signature: keyId="https://podcastperformance.com/users/russell#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"' \\
      -d '${body}'`;
  
    console.log('Curl Command:', curlCommand);
  
    /*try {
      const response = await fetch(inboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json',
          'Date': date,
          'Digest': `SHA-256=${digest}`,
          'Signature': `keyId="https://podcastperformance.com/users/russell#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`
        },
        body: body
      });
  
      const responseBody = await response.text();
      return {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      };
    } catch (error) {
      console.error('Error sending activity to inbox:', error);
      return {
        status: 'error',
        message: error
      };
    }*/
  }

async function handleUndoActivity(db: any, user: any, activity: any) {
    switch (activity.object.type) {
        case 'Follow':
            await db.unFollowUser(user.username, activity.object.actor);   
        break;
    
        default:
            break;
    }
   
 }