import os
from flask import send_file, request, jsonify
from flask import Flask
from flask_cors import CORS
import visualize_prediction as V
import pandas as pd
import warnings
from werkzeug.utils import secure_filename
import matplotlib.pyplot as plt
import base64
import json
import cv2
from io import BytesIO
from PIL import Image
import time


app = Flask(__name__)
CORS(app)
ENCODING = 'utf-8'
# create the folders when setting up your app
os.makedirs(os.path.join(app.instance_path), exist_ok=True)
plt.switch_backend('Agg') # 화면을 출력하지않는 백엔드모드로 전환


@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
   if request.method == 'POST':
      #f = request.files['file']
      start = time.time()  # 시작 시간 저장
      print("the request is")
      # print(request)
      content = request.json
      # print(content)

      file = content['base64img']
      diagnosis = content['diagnosis']
      file_name = content['fileName']

      starter = file.find(',')
      image_data = file[starter+1:]
      image_data = bytes(image_data, encoding="ascii")
      f = Image.open(BytesIO(base64.b64decode(image_data)))

      # when saving the file
      # This is hardcoded to work with Pneumonia need to fix for all diseases.
      # f.save(os.path.join(app.instance_path, secure_filename(file_name)))
      # f.save(os.path.join(app.instance_path, secure_filename('00000165_001.png')))
      # prediction
      STARTER_IMAGES= True
      PATH_TO_IMAGES = 'starter_images'
      # PATH_TO_IMAGES = 'instance'
      PATH_TO_MODEL = "pretrained/checkpoint"
      LABEL=[
        'Atelectasis',
        'Cardiomegaly',
        'Consolidation',
        'Edema',
        'Effusion',
        'Emphysema',
        'Fibrosis',
        'Hernia',
        'Infiltration',
        'Mass',
        'Nodule',
        'Pleural_Thickening',
        'Pneumonia',
        'Pneumothorax']
      # LABEL= diagnosis
      ## Need to figure out how to change the hardcoded values in order to change the diagnosis type

      POSITIVE_FINDINGS_ONLY= False
      # check the data loader for errors
      dataloader,model= V.load_data(PATH_TO_IMAGES,LABEL,PATH_TO_MODEL,POSITIVE_FINDINGS_ONLY,STARTER_IMAGES,file_name)
      print("Cases for review:")
      print(len(dataloader))
      # check the show_next for errors
      # preds, imglocation=V.show_next(dataloader,model, LABEL)
      preds, imglocations=V.multi_show_next(dataloader,model, LABEL)
      print(preds)
      print(imglocations)
      encodedimage = ""

      # img = cv2.imread(imglocation)
      # _, img_encoded = cv2.imencode('.jpg', img)

      base64_strings = []
      # Encode image
      for imglocation in imglocations:
         print('imglocation = ',imglocation)
         with open(imglocation, "rb") as image_file:
            encodedimage = base64.b64encode(image_file.read())
            base64_strings.append(encodedimage.decode(ENCODING))
            # print(encodedimage)
      # Base 64 string from image

      # Encode image
      # with open(imglocation, "rb") as image_file:
      #    encodedimage = base64.b64encode(image_file.read())
      # print(encodedimage)
      # # Base 64 string from image
      # base64_string = encodedimage.decode(ENCODING)

      jsonfiles = json.loads(preds.to_json())
      pred_time = time.time() - start
      print("pred_time :", pred_time)  # 현재시각 - 시작시간 = 실행 시간
      # print('jsonfiles:',jsonfiles)
      return jsonify({ 'prediction': jsonfiles, 'encodedimage': base64_strings, "time": pred_time })

   if __name__ == '__main__':
       app.run()