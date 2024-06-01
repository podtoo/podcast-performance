### Polls

Polls are a great way to ask your listeners/viewers a question. Podcast Performance has been built to allow 3rd party podcast players and websites to submit the answers back to the endpoint `/events`.

## Using `<podcast:poll>`

`<podcast:poll>` is designed to be at the episode level, and we have made it really simple for any podcast hosting provider to integrate.

### How Polls will look in your RSS feed

```xml
<podcast:poll id="ID GIVEN BY YOUR PODCAST SERVER LINKING TO THE POLL" question="What do you think about the episode" viewResult="true" exp="1716579412">
  <answers>
    <answer id="1" value="It's good"/>
    <answer id="2" value="It's ok"/>
    <answer id="3" value="I hate it"/>
  </answers>
</podcast:poll>
```

### Breaking it down

- `id`: is the Id that your podcast hosting provider has set for this poll.
- `question`: is the question you would like to ask your listeners or viewers.
- `answers`: each have an id, which your podcast hosting provider can store as they feel fit.
- `viewResult`: a boolean value that determines if people voting can see the answers.
- `exp`: the expiration time of the poll in Unix Time.

### Example Document in MongoDB

Here is an example document of how Polls could be stored in a MongoDB collection:

```javascript
{
  "_id": "uniqueObjectId",
  "pollId": "poll123", // Optional; you could just use _id
  "episodeGUID": "EPISODE GUID OR EVEN A _ID TO THE EPISODE INTERNALLY",
  "question": "What do you think about the episode?",
  "answers": [
    { "id": 1, "value": "It's good" },
    { "id": 2, "value": "It's ok" },
    { "id": 3, "value": "I hate it" }
  ],
  "endPoll": 1716579412,
  "viewResult": true // This tells us if people voting can see the answers
}
```

### How to Build a Poll Collection

Here is a quick sample of how to store polls or create your own poll system (we have not built this feature into here yet).

### NextJS API Example

```javascript
// pages/api/createPoll.js
import clientPromise from '../../lib/mongodb';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const { pollId, episodeGUID, question, answers, viewResult, endPoll } = req.body;

    // Validate the incoming data
    if (!pollId || !episodeGUID || !question || !answers || typeof viewResult !== 'boolean' || !endPoll) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create the poll document
    const newPoll = {
      pollId,
      episodeGUID,
      question,
      answers,
      viewResult,
      endPoll,
    };

    // Insert the poll into the collection
    const result = await db.collection('polls').insertOne(newPoll);

    res.status(201).json({ message: 'Poll saved successfully', pollId: result.insertedId });
  } catch (error) {
    console.error('Error saving poll:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } 
};

export default handler;
```

### Simple Front End Example

```javascript
// pages/poll.js
import { useState } from 'react';

const PollPage = () => {
  const [pollId, setPollId] = useState('');
  const [episodeGUID, setEpisodeGUID] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [viewResult, setViewResult] = useState(true);
  const [endPoll, setEndPoll] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pollData = {
      pollId,
      episodeGUID,
      question,
      answers: answers.map((answer, index) => ({ id: index + 1, value: answer })),
      viewResult,
      endPoll: parseInt(endPoll, 10),
    };

    try {
      const response = await fetch('/api/createPoll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Poll created successfully');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Create a Poll</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Poll ID:</label>
          <input type="text" value={pollId} onChange={(e) => setPollId(e.target.value)} required />
        </div>
        <div>
          <label>Episode GUID:</label>
          <input type="text" value={episodeGUID} onChange={(e) => setEpisodeGUID(e.target.value)} required />
        </div>
        <div>
          <label>Question:</label>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div>
          <label>Answers:</label>
          {answers.map((answer, index) => (
            <input
              key={index}
              type="text"
              value={answer}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[index] = e.target.value;
                setAnswers(newAnswers);
              }}
              required
            />
          ))}
        </div>
        <div>
          <label>View Result:</label>
          <input
            type="checkbox"
            checked={viewResult}
            onChange={(e) => setViewResult(e.target.checked)}
          />
        </div>
        <div>
          <label>End Poll (Unix Time):</label>
          <input type="number" value={endPoll} onChange={(e) => setEndPoll(e.target.value)} required />
        </div>
        <button type="submit">Create Poll</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PollPage;
```
