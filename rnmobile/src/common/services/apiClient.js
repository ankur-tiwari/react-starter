import axios from 'axios';
import { selectToken, logout } from '../../features/auth/ducks';
import config from '../../config';
import AlertService from './alert';

const normalizeSuccessResponse = response => ({
  ...response,
  ok: true,
});

const normalizeErrorResponse = error => ({
  ...error,
  ok: false,
});

const apiClient = axios.create({
  responseType: 'json',
  baseURL: config.apiUrl,
});

export default apiClient;

export function prepareRequestInterceptor(store) {
  apiClient.interceptors.request.use(config => {
    const token = selectToken(store.getState());

    if (token) {
      config.headers.common = config.headers.common || {};
      config.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return config;
  });
}

export function handleResponsesInterceptor(store) {
  apiClient.interceptors.response.use(
    response => normalizeSuccessResponse(response),
    error => {
      if (error.response && error.response.status === 401) {
        store.dispatch(logout());
      }

      showErrorMessage(error);

      return normalizeErrorResponse(error);
    }
  );
}

function showErrorMessage(error) {
  const errorMsg = error.response
    ? error.response.data.message || error.response.data.error.inner
    : error;

  if (Array.isArray(errorMsg)) {
    AlertService.error(errorMsg.reduce((acc, curr) => `${acc}\n${curr}`, ''));
  } else {
    AlertService.error(`${errorMsg}`);
  }
}
