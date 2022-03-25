import './App.css';
import React from 'react';
<title>Awesome interesting stuff</title>

// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};


function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(''); // represented as readable data (text string)
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState('Submit');

  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    console.log('converting file to bytes...');
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  // handle file input
  const handleChange = async (event) => {
    // Clear output text.
    setOutputFileData("");

    console.log('newly uploaded file');
    const inputFile = event.target.files[0];
    console.log(inputFile);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log('file converted successfully');

    // enable submit button
    setButtonDisable(false);
  }

  // handle file submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setButtonText('Loading Result');

    // make POST request
    console.log('making POST request...');
    fetch('https://oh0ld9alb2.execute-api.us-east-1.amazonaws.com/prod', {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "image": inputFileData })
    }).then(response => response.json())
    .then(data => {
      console.log('getting response...')
      console.log(data);

      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputPredictionData'];
        setOutputFileData(outputErrorMessage);
      }

      // POST request success
      else {
        const outputBytesData = JSON.parse(data.body)['outputPredictionData'];
        setOutputFileData(decodeFileBase64(outputBytesData));
      }

      // re-enable submit button
      setButtonDisable(false);
      setButtonText('Submit');
    })
    .then(() => {
      console.log('POST request success');
    })
  }

  return (
    <div className="App">
      <div className="Input">
        <h1 align="left" style="color: white;">Stock Prediction</h1>
        <h2 align="left" style="color: white;">Name:Yichen Li, email:liyichen@umich.edu</h2>
        <h1 align="left" style="color: white;">Input</h1>
        <p align="left" style="color: white;">
          Please input a .csv file with content as following:<br />
          "attribute": open, low, high, close, volume<br />
          "target": AMD, AMZN, GOOG, IBM, IT, JPM, NFLX, WAT, WM, ZION<br />
        </p>
        <form onSubmit={handleSubmit}>
          <input type="file" accept=".csv" onChange={handleChange} />
          <button type="submit" disabled={buttonDisable}>{buttonText}</button>
        </form>
      </div>
      <div className="Output">
        <h3 align="left" style="color: white;">Results</h3>
        <h1 align="left" style="color: white;">Relation</h1>
        <p align="left" style="color: white;">
          This chart reveals the relationship between stocks mentioned in "targets" above, with the same sort<br />
          Having the default (best) history investigation length of 120 trading days.
        </p>
        <p>{outputFileData}</p>
        <h1 align="left" style="color: white;">Prediction</h1>
        <p align="left" style="color: white;">
          This chart reveals the prediciton based on LSTM and LSTM with GreyRelationship calibration.<br />
          The prediciton part is set automatically 120 trading days after the querying day (today), 
          for the application currently using prediciton result from previous LSTM and calibration,
          so the longer the querying day is, the worse the prediction effect and accuracy will be. 
          As the test goes on, I think 120 timestamp, that is, the prediction accuracy of 120 trading days, 
          is acceptable.<br />
          Here by showing the slice of the history (training) data and 120 days prediciton result.<br /> 
        </p>
        <p>{outputFileData}</p>
      </div>
    </div>
  );
}

export default App;
