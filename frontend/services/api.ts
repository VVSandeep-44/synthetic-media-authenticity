export type PredictionRequest = {
  file: File;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

function networkErrorMessage() {
  return 'Backend API is not reachable. Start FastAPI on http://127.0.0.1:8000 and try again.';
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload?.detail) {
      return payload.detail;
    }
  } catch {
    // Fall through to generic message.
  }

  return `Request failed with status ${response.status}`;
}

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

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export function isVideoPredictionResponse(response: PredictionResponse): response is VideoPredictionResponse {
  return 'sampled_frames_explanations' in response;
}

export function isImagePredictionResponse(response: PredictionResponse): response is ImagePredictionResponse {
  return 'gradcam_overlay_base64' in response;
}

export async function predictImage(request: PredictionRequest): Promise<ImagePredictionResponse> {
  const formData = new FormData();
  formData.append('file', request.file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/predict/image`, {
      method: 'POST',
      body: formData
    });
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ImagePredictionResponse;
}

export async function predictVideo(request: PredictionRequest): Promise<VideoPredictionResponse> {
  const formData = new FormData();
  formData.append('file', request.file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/predict/video`, {
      method: 'POST',
      body: formData
    });
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as VideoPredictionResponse;
}

export async function predictMedia(request: PredictionRequest): Promise<PredictionResponse> {
  return request.file.type.startsWith('video/') ? predictVideo(request) : predictImage(request);
}
