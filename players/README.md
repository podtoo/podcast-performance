# podcast-performance/players
Podcast-Performance/players is our open source code that allows anyone to host their own `<podcast:performance>` server and get key metrics of their episode data.

# Idea
Players should only send episode performance once. Either when the player switches to another podcast or when the app is exited. This will limit the IP leakage and other privacy concerns.

The data is also not time sensitive as we don't store or send the date/time that the user listened to it, so technically you could store this locally for X hours and then send it to protect users privacy even more.

While Bots may click play, we are able to check that on the server side and remove them at a later date, also bots don't normally listen for long periods of time (unless it's radio).




# Demo of idea
You can view the source code for a javascript web based player here - https://codepen.io/redimongo/full/BaeQyaP 

# Players Code
We will publish a number of different players over the next few months. Please if you want to contribute we welcome you too.
