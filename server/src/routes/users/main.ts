import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const fs = require('fs');
const mustache = require('mustache');
const path = require('path');

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
router.get('/@:username', (req, res) => {
  const username = req.params.username;

  if (req.headers.accept && req.headers.accept.includes('activity+json')) {
      // Load the JSON template
      const template = fs.readFileSync(path.join(__dirname, '../../utils/core/json/users/person.json'), 'utf8');

      // Example data, replace this with actual data fetching logic
      const data = {
        serverDomain: "podcastperformance.com",
        username: username,
        name: "John Doe",
        createdAt: "2024-06-03T00:00:00Z",
        publicKeyPem: "PUBLIC_KEY_PEM_STRING",
        iconPic: {
            type: "image/png",
            url: "https://podcastperformance.com/media/icon.png"
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

    const test = '{"@context":["https://www.w3.org/ns/activitystreams","https://w3id.org/security/v1",{"manuallyApprovesFollowers":"as:manuallyApprovesFollowers","toot":"http://joinmastodon.org/ns#","featured":{"@id":"toot:featured","@type":"@id"},"featuredTags":{"@id":"toot:featuredTags","@type":"@id"},"alsoKnownAs":{"@id":"as:alsoKnownAs","@type":"@id"},"movedTo":{"@id":"as:movedTo","@type":"@id"},"schema":"http://schema.org#","PropertyValue":"schema:PropertyValue","value":"schema:value","discoverable":"toot:discoverable","Device":"toot:Device","Ed25519Signature":"toot:Ed25519Signature","Ed25519Key":"toot:Ed25519Key","Curve25519Key":"toot:Curve25519Key","EncryptedMessage":"toot:EncryptedMessage","publicKeyBase64":"toot:publicKeyBase64","deviceId":"toot:deviceId","claim":{"@type":"@id","@id":"toot:claim"},"fingerprintKey":{"@type":"@id","@id":"toot:fingerprintKey"},"identityKey":{"@type":"@id","@id":"toot:identityKey"},"devices":{"@type":"@id","@id":"toot:devices"},"messageFranking":"toot:messageFranking","messageType":"toot:messageType","cipherText":"toot:cipherText","suspended":"toot:suspended","memorial":"toot:memorial","indexable":"toot:indexable","focalPoint":{"@container":"@list","@id":"toot:focalPoint"}}],"id":"https://podcastindex.social/users/russell","type":"Person","following":"https://podcastindex.social/users/russell/following","followers":"https://podcastindex.social/users/russell/followers","inbox":"https://podcastindex.social/users/russell/inbox","outbox":"https://podcastindex.social/users/russell/outbox","featured":"https://podcastindex.social/users/russell/collections/featured","featuredTags":"https://podcastindex.social/users/russell/collections/tags","preferredUsername":"russell","name":"Russell Harrower 🎙️","summary":"","url":"https://podcastindex.social/@russell","manuallyApprovesFollowers":false,"discoverable":false,"indexable":false,"published":"2023-08-02T00:00:00Z","memorial":false,"devices":"https://podcastindex.social/users/russell/collections/devices","publicKey":{"id":"https://podcastindex.social/users/russell#main-key","owner":"https://podcastindex.social/users/russell","publicKeyPem":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw6ZN+jP70oNQZL6rNVhZ\n5Y+bi4p5JAP6JaE8x8lL1yqZjy+5Bju7R+jqoMYyiSLU7jV00MnK4ro6LkxvqcJx\np+5wrzuE/C2uOm+dc6XDUDBkq5PPMo+d1leQRXXEwy24weLc9cYkwiHXVzGNO1A0\nnn35hCFTwWcNToRrALCYy+DZhp1a8HefqPIO96ReY5mnTIAjqyyn1phN0UK18oZe\nQ7oXOUZArfzkzncG1gHMHtXS7dAk+YnFf/KqJVk+l31cEa9fHdAiyoFeH4aIcfdk\nF68QpNWmSskviUeZ+t3UnZwc4iD09aCmAvmtRGbui47NmietLjrNxSQmFmR+9V2n\nIQIDAQAB\n-----END PUBLIC KEY-----\n"},"tag":[],"attachment":[{"type":"PropertyValue","name":"Head Developer/Creator","value":"PodToo.com"},{"type":"PropertyValue","name":"Founder","value":"DRN1.com.au"}],"endpoints":{"sharedInbox":"https://podcastindex.social/inbox"},"icon":{"type":"Image","mediaType":"image/png","url":"https://cdn.masto.host/podcastindexsocial/accounts/avatars/110/822/715/413/028/837/original/f8d8f4942d00a5b0.png"},"image":{"type":"Image","mediaType":"image/png","url":"https://cdn.masto.host/podcastindexsocial/accounts/headers/110/822/715/413/028/837/original/c17e947865a4cb8a.png"}}';
    // Send the JSON response
    res.json(test);
  } else {
      // Otherwise, render an EJS template
      res.render('users/home', { username });
  }
});


// Define the route with the dynamic username parameter
/*router.get('/:username', async (req, res) => {
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
        name: "John Doe",
        createdAt: "2024-06-03T00:00:00Z",
        publicKeyPem: "PUBLIC_KEY_PEM_STRING",
        iconPic: {
            type: "image/png",
            url: "https://podcastperformance.com/media/icon.png"
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
    const profileResponse = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "id": `https://podcastperformance.com/users/${username}`,
      "type": "Person",
      "preferredUsername": username,
      "inbox": `https://podcastperformance.com/users/${username}/inbox`,
      "outbox": `https://podcastperformance.com/users/${username}/outbox`,
      "followers": `https://podcastperformance.com/users/${username}/followers`,
      "following": `https://podcastperformance.com/users/${username}/following`,
      "publicKey": {
          "id": `https://podcastperformance.com/users/${username}#main-key`,
          "owner": `https://podcastperformance.com/users/${username}`,
          "publicKeyPem": user.publicKeyPem // Ensure this is stored and retrieved properly
      },
      "icon": {
          "type": "Image",
          "mediaType": "image/png",
          "url": `https://podcastperformance.com/path/to/avatar.png` // Update with actual avatar URL
      }
  };


    res.setHeader('Content-Type', 'application/activity+json');
  
    // Send the JSON response
    return res.json(profileResponse);
  } else {
      // Otherwise, render an EJS template
      res.render('users/home', { username });
  }
});*/


export default router;