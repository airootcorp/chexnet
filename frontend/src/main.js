import React, { Component } from "react";
import "./main.css";
import { css } from "@emotion/core";
import { ClipLoader } from "react-spinners";
var base64Img = require('base64-img');

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

class Main extends Component {

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
        // let url = "https://chexnet.herokuapp.com/";

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
                loading: false,
            })

            console.log("걸린 시간 = ", new Date().getTime() - startTime);
        } catch (err) {
            console.error("Error:", err);
        }
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
            <div className="main-wrapper">
                <div className="wrapper">
                    <h1>Chest X-ray Discrimination AI</h1>
                    <div>
                        <script class="jsbin" src="https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
                        <div class="file-upload">
                            <div class="image-upload-wrap">
                                <input class="file-upload-input" type='file' onChange={this.handleselectedFile} accept="image/*" />
                                <div class="drag-text">
                                    <h3>Drag & drop a file<br />or<br /> select add Image</h3>
                                </div>
                            </div>
                        </div>

                        {this.state.selectedFile && (
                            <div className="file-uploaded-wrap">
                                <img
                                    className="file-upload-image"
                                    src={URL.createObjectURL(this.state.selectedFile)}
                                />
                                <button className="prediction-btn" onClick={this.handleUpload}>Make prediction</button>
                            </div>
                        )}

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
                                <h5>Prediction time : {String(this.state.response.time)}</h5>

                                <table
                                    border="1"
                                    width="100%"
                                    height="auto"
                                    cellSpacing="5">
                                    <caption>Result</caption>
                                    <thead>
                                        <tr align="center">
                                            <td></td>
                                            <th>Pred Result</th>
                                            <th>image</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.diseases.map(((disease, index) => (
                                            <tr>
                                                <td>{disease}</td>
                                                <td>{String(this.state.response.prediction["Pred Result"][disease])}</td>
                                                <td><img className="Prediction-image" src={"data:image/png;base64," + this.state.response.encodedimage[index]} /></td>
                                            </tr>
                                        )))}
                                    </tbody>

                                </table>

                            </div>
                        )}


                    </div>
                </div>

            </div>

        );
    }
}

export default Main;
