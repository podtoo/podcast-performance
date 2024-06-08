import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/webfinger', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resource = req.query.resource as string;

        if (!resource) {
            return res.status(400).json({ error: 'Missing resource parameter' });
        }

        // Check if the resource parameter matches the pattern for an acct (account)
        const acctMatch = resource.match(/^acct:([^@]+)@(.+)$/);

        if (!acctMatch) {
            return res.status(400).json({ error: 'Invalid resource parameter format' });
        }
        const serverInfo = await req.db.checkPerformance({});


        const [_, username, domain] = acctMatch;

        if (domain !== serverInfo.domain) { // Replace with your actual domain
            return res.status(404).json({ error: 'Domain not found' });
        }

        console.log(username);
        const user = await req.db.findUser({ "username": username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        // Create the WebFinger response
        // Create the WebFinger response
        const webFingerResponse = {
            subject: `acct:${username}@${domain}`,
            aliases: [
                `https://${serverInfo.domain}/@${username}`,
                `https://${serverInfo.domain}/users/${username}`
            ],
            links: [
                {
                    rel: 'http://webfinger.net/rel/profile-page',
                    type: 'text/html',
                    href: `https://${serverInfo.domain}/@${username}`
                },
                {
                    rel: 'self',
                    type: 'application/activity+json',
                    href: `https://${serverInfo.domain}/users/${username}`
                },
                {
                    rel: 'http://ostatus.org/schema/1.0/subscribe',
                    template: `https://${serverInfo.domain}/authorize_interaction?uri={uri}`
                },
                {
                    rel: 'http://webfinger.net/rel/avatar',
                    type: 'image/png',
                    href: `${user.avatar}` // Adjust the path to the user's avatar
                }
            ]
        };


        return res.json(webFingerResponse);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('hostinfo', async (req, res)=>{
    const serverInfo = await req.db.checkPerformance();
    const hostInfo = `{"links":[{"rel":"http://nodeinfo.diaspora.software/ns/schema/2.0","href":"https://${serverInfo.domain}/nodeinfo/2.0"}]}`
    res.send(hostInfo);
})

router.get('nodeinfo', async (req, res)=>{
    const serverInfo = await req.db.checkPerformance();
    const hostInfo = `{"links":[{"rel":"http://nodeinfo.diaspora.software/ns/schema/2.0","href":"https://${serverInfo.domain}/nodeinfo/2.0"}]}`
    res.send(hostInfo);
})

router.get('/host-meta', async (req, res) => {

    const serverInfo = await req.db.checkPerformance();

    const hostMeta = `<?xml version="1.0" encoding="UTF-8"?>
    <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
      <Link rel="lrdd" type="application/xrd+xml" template="https://${serverInfo.domain}/.well-known/webfinger?resource={uri}"/>
    </XRD>`;
  
    res.setHeader('Content-Type', 'application/xml');
    res.send(hostMeta);
  });

export default router;
