import { API_CONFIG } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status_code?: number;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Remove authentication token
   */
  clearAuthToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...(this.defaultHeaders as Record<string, string>),
      ...(customHeaders as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout. Please try again.');
    }

    if (error.response) {
      const { status, data } = error.response;
      return new Error(data?.message || `HTTP Error: ${status}`);
    }

    const message = error?.message || '';
    if (
      typeof message === 'string' &&
      (message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('network error') ||
        message.toLowerCase().includes('load failed'))
    ) {
      return new Error(
        `Cannot connect to server. Is the backend running at ${this.baseURL}? Check the console for details.`
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred. Please try again.');
  }

  /**
   * Create abort controller for timeout
   */
  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
  }

  /**
   * Retry request on failure
   */
  private async retryRequest(
    url: string,
    options: RequestOptions,
    retries: number
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || i === retries) {
          return response;
        }
      } catch (error) {
        lastError = error as Error;
        if (i < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1))
          );
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const headers = this.buildHeaders(customHeaders);
    const controller = this.createAbortController(timeout);

    try {
      const response = await this.retryRequest(
        fullUrl,
        {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        },
        retries
      );

      const data = await response.json();

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data,
          },
        };
      }

      // Preserve pagination fields (page, pageSize, totalRows) for endpoints like /assets/register
      const out: ApiResponse<T> & { page?: number; pageSize?: number; totalRows?: number } = {
        success: true,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
        status_code: response.status,
      };
      if (data.page !== undefined) out.page = data.page;
      if (data.pageSize !== undefined) out.pageSize = data.pageSize;
      if (data.totalRows !== undefined) out.totalRows = data.totalRows;
      return out;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
