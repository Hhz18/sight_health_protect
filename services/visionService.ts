import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

let model: blazeface.BlazeFaceModel | null = null;

export const loadModel = async (): Promise<void> => {
  if (model) return;
  await tf.ready();
  model = await blazeface.load();
  console.log("BlazeFace model loaded");
};

export const detectFace = async (video: HTMLVideoElement): Promise<{ width: number; detected: boolean }> => {
  if (!model || video.readyState !== 4) return { width: 0, detected: false };

  const returnTensors = false;
  const predictions = await model.estimateFaces(video, returnTensors);

  if (predictions.length > 0) {
    const prediction = predictions[0] as { topLeft: number[]; bottomRight: number[] };
    const start = prediction.topLeft as [number, number];
    const end = prediction.bottomRight as [number, number];
    
    // Calculate width of the bounding box
    const width = Math.abs(end[0] - start[0]);
    return { width, detected: true };
  }

  return { width: 0, detected: false };
};
