export class ApiResponse<T> {
  public success: boolean;
  public message: string;
  public data?: T;
  public meta?: Record<string, any>;

  constructor({
    success,
    message,
    data,
    meta,
  }: {
    success: boolean;
    message: string;
    data?: T;
    meta?: Record<string, any>;
  }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(data: T, meta?: Record<string, any>, message = "Success") {
    return new ApiResponse<T>({
      success: true,
      message,
      data,
      meta
    });
  }

  static error(message = "Error") {
    return new ApiResponse<null>({
      success: false,
      message,
    });
  }
}
