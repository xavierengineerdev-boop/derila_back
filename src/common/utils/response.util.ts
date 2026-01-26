export class ResponseUtil {
  static success<T>(data: T, message = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errors?: any) {
    return {
      success: false,
      message,
      errors,
    };
  }
}


