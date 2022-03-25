import './App.css';
import React from 'react';

// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};

function decodeImageBase64(dataurl, filename) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

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
        const outputPredictionData = JSON.parse(data.body)['outputPredictionData'];
        const outputRelationData = JSON.parse(data.body)['outputRelationData'];
        setOutputFileData(decodeImageBase64(outputPredictionData, "prediction.png"));
        setOutputFileData(decodeImageBase64(outputRelationData, "relation.png"));
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
        <h1>Input</h1>
        <p>
          Please input a .csv file with content as following:<br />
          "attribute": open, low, high, close, volume<br />
          "target": AMD, AMZN, GOOG, IBM, IT, JPM, NFLX, WAT, WM, ZION<br />
        </p>
        <form onSubmit={handleSubmit}>
          <input type="file" accept=".png" onChange={handleChange} />
          <button type="submit" disabled={buttonDisable}>{buttonText}</button>
        </form>
      </div>
      <div className="Output">
        <h1>Relation</h1>
        <p>
          This chart reveals the relationship between the "targets" mentioned above<br />
          with default investigating length of 120 trading days<br />
        </p>
        <p>{outputRelationData}</p>
        <h1>Prediction</h1>
        <p>
          This chart reveals the prediciton based on LSTM and LSTM with GreyRelationship calibration.<br />
          The prediciton part is set automatically 120 trading days after the querying day (today), 
          for the application currently using prediciton result from previous LSTM and calibration,
          so the longer the querying day is, the worse the prediction effect and accuracy will be. 
          As the test goes on, I think 120 timestamp, that is, the prediction accuracy of 120 trading days, 
          is acceptable.<br />
          Here by showing the slice of the history (training) data and 120 days prediciton result.<br /> 
        </p>
        <p>{outputPredictionData}</p>
      </div>
    </div>
  );
}

export default App;
