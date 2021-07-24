import React, { Component } from "react";
import logo from "./logo.svg";
import radiology from "./radiology.png";
import prediction from "./prediction.png";
import "./App.css";
import { css } from "@emotion/core";
import { ClipLoader } from "react-spinners";
import { PDFReader } from "react-read-pdf";
var base64Img = require('base64-img');

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

class App extends Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef(); // Create a ref object
    this.state = { showPrediction: false, loading: false, pictures: {} };
    this.cols = [];
    this.diseases = [];
  }

  handleUpload = async () => {
    console.log("uploaded the image");

    this.setState({
      loading: true
    });
    setTimeout(this.upload, 750);

  };

  reqListener = () => {
    console.log(this.responseText);
  };

  base64encode = () => {
    return new Promise((resolve, reject) => {
      var file = this.state.selectedFile;
      var reader = new FileReader();
      reader.onloadend = () => {
        console.log("RESULT", reader.result);
        resolve(reader.result)
      }
      reader.readAsDataURL(file);
    })
  };

  decode_utf8 = (s) => {
    console.log("inside decode with", s)
    return new Promise((resolve, reject) => {
      resolve(decodeURIComponent(escape(s)))
    })
  }


  upload = async () => {
    this.setState({
      showPrediction: true,
      loading: false
    });
    var startTime = new Date().getTime();

    let file = this.state.selectedFile;
    let fileName = file.name;
    console.log("the file is", file);
    let base64img = await this.base64encode();
    console.log("the image is", base64img)

    let diagnosis

    if (this.state.diagnosis) {
      diagnosis = this.state.diagnosis;
    } else {
      diagnosis = "Pneumonia"
    }

    let url = "http://localhost:5000/uploader";

    try {
      let data = { base64img, diagnosis, fileName };
      // try to send the image using fetch
      let response = await fetch(url, {
        method: "POST", // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("the response is", response)

      let responseJson = await response.json();
      console.log("the response json is", responseJson);
      const imageString = responseJson.encodedimage
      console.log('imageString = ', imageString)
      const decodedImage = await this.decode_utf8(imageString)
      this.cols = Object.keys(responseJson["prediction"])
      this.diseases = Object.keys(responseJson["prediction"][this.cols[0]])
      console.log(this.cols);
      console.log(this.diseases);


      this.setState({
        response: responseJson,
        image: decodedImage,

      })
      console.log("걸린 시간 = ", new Date().getTime() - startTime);
    } catch (err) {
      console.error("Error:", err);
    }

    // var formData = new FormData();



    // // HTML file input, chosen by user
    // formData.append("file", file);
    // var request = new XMLHttpRequest();
    // request.addEventListener("load", this.reqListener);
    // request.open("POST", "http://localhost:5000/uploader");
    // request.send(formData);
  };

  handleselectedFile = event => {
    this.setState({
      selectedFile: event.target.files[0]
    });
  };

  setDiagnosis = event => {
    this.setState({ diagnosis: event.target.value });
  };

  render() {


    return (
      <div className="App">
        <div className="App-header">
          {/* <img src={radiology} alt="logo" /> */}

          {this.state.selectedFile && (
            <div>
              <img
                className="App-logo"
                src={URL.createObjectURL(this.state.selectedFile)}
              />
            </div>
          )}

          <p>Radiology prediction</p>
          <div>
            <select onChange={this.setDiagnosis} value={this.state.value}>
              <option value="Atelectasis">Atelectasis</option>
              <option value="Cardiomegaly">Cardiomegaly</option>
              <option value="Effusion">Effusion</option>
              <option value="Infiltration">Infiltration</option>
              <option value="Mass">Mass</option>
              <option value="Nodule">Nodule</option>
              <option selected value="Pneumonia">
                Pneumonia
              </option>
              <option value="Pneumothorax">Pneumothorax</option>
              <option value="Consolidation">Consolidation</option>
              <option value="Edema">Edema</option>
              <option value="Emphysema">Emphysema</option>
              <option value="Fibrosis">Fibrosis</option>
              <option value="Pleural_Thickening">Pleural_Thickening</option>
              <option value="Hernia">Hernia</option>
            </select>
            <input type="file" name="file" onChange={this.handleselectedFile} />
            <button onClick={this.handleUpload}>Make prediction</button>
          </div>

          <div className="Prediction-container">
            <div className="Prediction-loader-container">
              <ClipLoader
                css={override}
                sizeUnit={"px"}
                size={150}
                color={"#123abc"}
                loading={this.state.loading}
              />
            </div>
          </div>

          {this.state.showPrediction && this.state.response && this.state.response.prediction && (
            <div className="Prediction-container" id="prediction">
              <table
                border="1"
                width="100%"
                height="auto"
                cellSpacing="5">
                <caption>분석 결과</caption>
                <thead>
                  <tr align="center">
                    <td></td>
                    {this.cols.map((col) => (
                      <th>{col}</th>
                    ))}
                    <th>image</th>
                  </tr>
                </thead>
                <tbody>
                  {this.diseases.map(( (disease, index ) => (
                    <tr>
                      <td>{disease}</td>
                      {this.cols.map((col) => (
                        <td>{String(this.state.response.prediction[col][disease])}</td>
                      ))}
                      <td><img className="Prediction-image" src={"data:image/png;base64," + this.state.response.encodedimage[index]} /></td>
                    </tr>
                  )))}
                </tbody>

              </table>

              <h5>걸린 시간, {String(this.state.response.time)}</h5>
              {/* <h5>Pred Result, {String(this.state.response.prediction["Pred Result"]["Pneumonia"])}</h5> */}
              {/* <h5>Prediction, Pneumonia, {this.state.response.prediction["Predicted Probability"]["Pneumonia"]}</h5> */}
              {/* <img className="Prediction-image" src={prediction}/> */}
              {/* {this.state.response.encodedimage.map(image =>(
                <img className="Prediction-image" src={"data:image/png;base64," + image} />
              ))} */}
            </div>
          )}

          <div>
            {" "}
            <a target="_blank" href="https://arxiv.org/pdf/1711.05225.pdf">
              <p>Based on ChexNet</p>
            </a>
            <div style={{ overflow: "scroll", height: 600 }}>
              <PDFReader url="https://arxiv.org/pdf/1711.05225.pdf" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
