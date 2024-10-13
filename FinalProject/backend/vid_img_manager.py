from pose_estimator import PoseEstimator
import cv2

class VideoImgManager:

    def __init__(self):
        self.pose_estimator = PoseEstimator()

    def estimate_img(self, img_path):
        img = cv2.imread(img_path)
        img = self.pose_estimator.get_pose_key_angles(img)
        cv2.imshow("Pose Estimation", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    def estimate_vid(self, webcam_id=0):
        cap = cv2.VideoCapture(webcam_id)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = self.pose_estimator.get_pose_key_angles(frame)
            cv2.imshow("Pose Estimation", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        cap.release()
        cv2.destroyAllWindows()
