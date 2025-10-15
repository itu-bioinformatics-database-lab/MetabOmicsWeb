export class AppSettings {
  public static get API_ENDPOINT(): string {
    //return 'http://metabolitics.biodb.sehir.edu.tr/api';
    // Comment below line for local development
    // return 'http://164.90.180.104/api';
    // Uncomment below line for local development
    return 'http://127.0.0.1:5000';
    // return 'https://metabolitics.itu.edu.tr/api';
  }

  public static get NOTIFICATION_OPTIONS() {
    return { timeOut: 10000 };
  }
}
