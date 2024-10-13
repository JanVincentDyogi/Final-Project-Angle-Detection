from flask import Flask, Response, render_template, request
import cv2
from pose_estimator import PoseEstimator
import threading

app = Flask(__name__)

camera_on = False
pose_estimator = PoseEstimator()

def generate_frames():
    global camera_on
    cap = cv2.VideoCapture(0)
    while camera_on:
        success, frame = cap.read()
        if not success:
            break
        else:
            frame = pose_estimator.get_pose_key_angles(frame)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_camera', methods=['POST'])
def start_camera():
    global camera_on
    camera_on = True
    threading.Thread(target=generate_frames).start()
    return "Camera started"

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global camera_on
    camera_on = False
    return "Camera stopped"

if __name__ == '__main__':
    app.run(debug=True)