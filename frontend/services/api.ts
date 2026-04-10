export type PredictionRequest = {
  file: File;
};

export type ImagePredictionResponse = {
  label: string;
  confidence: number;
  gradcam_overlay_base64: string;
  vit_overlay_base64: string;
  explanation_text: string;
};

export type VideoFrameExplanation = {
  frame_index: number;
  label: string;
  confidence: number;
  gradcam_overlay_base64: string;
  vit_overlay_base64: string;
  explanation_text: string;
};

export type VideoPredictionResponse = {
  label: string;
  confidence: number;
  sampled_frames_explanations: VideoFrameExplanation[];
};

export type PredictionResponse = ImagePredictionResponse | VideoPredictionResponse;

export function isVideoPredictionResponse(response: PredictionResponse): response is VideoPredictionResponse {
  return 'sampled_frames_explanations' in response;
}

export function isImagePredictionResponse(response: PredictionResponse): response is ImagePredictionResponse {
  return 'gradcam_overlay_base64' in response;
}

export async function predictImage(request: PredictionRequest): Promise<ImagePredictionResponse> {
  const formData = new FormData();
  formData.append('file', request.file);

  const response = await fetch('http://localhost:8000/predict/image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Prediction request failed with status ${response.status}`);
  }

  return (await response.json()) as ImagePredictionResponse;
}

export async function predictVideo(request: PredictionRequest): Promise<VideoPredictionResponse> {
  const formData = new FormData();
  formData.append('file', request.file);

  const response = await fetch('http://localhost:8000/predict/video', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Video prediction request failed with status ${response.status}`);
  }

  return (await response.json()) as VideoPredictionResponse;
}

export async function predictMedia(request: PredictionRequest): Promise<PredictionResponse> {
  return request.file.type.startsWith('video/') ? predictVideo(request) : predictImage(request);
}
