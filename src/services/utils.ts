import { KeycloakService } from '@services/keycloakService';
import { AuthenticationService } from '@services/authService';

export enum ComponentStatus {
  STOPPING = 'STOPPING',
  RUNNING = 'RUNNING',
  OK = 'OK',
  CANCELLING = 'CANCELLING',
  SENDING = 'SENDING',
  ERROR = 'ERROR',
  INSTANTIATED = 'INSTANTIATED',
  INITIALIZING = 'INITIALIZING',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ComponentHealth {
  HEALTHY = 'HEALTHY',
  HEALTHY_REBALANCING = 'HEALTHY_REBALANCING',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
}

export enum CacheType {
  Distributed = 'Distributed',
  Replicated = 'Replicated',
  Local = 'Local',
  Invalidated = 'Invalidated',
  Scattered = 'Scattered',
}

export enum ContentType {
  StringContentType = 'String', //'application/x-java-object;type=java.lang.String'
  JSON = 'Json', //'application/json'
  XML = 'Xml', //'application/xml'
  IntegerContentType = 'Integer', //'application/x-java-object;type=java.lang.Integer'
  DoubleContentType = 'Double', //'application/x-java-object;type=java.lang.Double'
  FloatContentType = 'Float', //'application/x-java-object;type=java.lang.Float'
  LongContentType = 'Long', //'application/x-java-object;type=java.lang.Long'
  BooleanContentType = 'Boolean', //'application/x-java-object;type=java.lang.Boolean'
  BytesType = 'Bytes', //'Bytes'
  OctetStream = 'Base64', //'application/octet-stream'
  OctetStreamHex = 'Hex', //'application/octet-stream; encoding=hex'
}

export enum Flags {
  CACHE_MODE_LOCAL = 'CACHE_MODE_LOCAL',
  FAIL_SILENTLY = 'FAIL_SILENTLY',
  FORCE_ASYNCHRONOUS = 'FORCE_ASYNCHRONOUS',
  FORCE_SYNCHRONOUS = 'FORCE_SYNCHRONOUS',
  FORCE_WRITE_LOCK = 'FORCE_WRITE_LOCK',
  IGNORE_RETURN_VALUES = 'IGNORE_RETURN_VALUES',
  IGNORE_TRANSACTION = 'IGNORE_TRANSACTION',
  PUT_FOR_EXTERNAL_READ = 'PUT_FOR_EXTERNAL_READ',
  REMOTE_ITERATION = 'REMOTE_ITERATION',
  SKIP_CACHE_LOAD = 'SKIP_CACHE_LOAD',
  SKIP_CACHE_STORE = 'SKIP_CACHE_STORE',
  SKIP_INDEX_CLEANUP = 'SKIP_INDEX_CLEANUP',
  SKIP_INDEXING = 'SKIP_INDEXING',
  SKIP_LISTENER_NOTIFICATION = 'SKIP_LISTENER_NOTIFICATION',
  SKIP_LOCKING = 'SKIP_LOCKING',
  SKIP_OWNERSHIP_CHECK = 'SKIP_OWNERSHIP_CHECK',
  SKIP_REMOTE_LOOKUP = 'SKIP_REMOTE_LOOKUP',
  SKIP_SHARED_CACHE_STORE = 'SKIP_SHARED_CACHE_STORE',
  SKIP_SIZE_OPTIMIZATION = 'SKIP_SIZE_OPTIMIZATION',
  SKIP_STATISTICS = 'SKIP_STATISTICS',
  SKIP_XSITE_BACKUP = 'SKIP_XSITE_BACKUP',
  ZERO_LOCK_ACQUISITION_TIMEOUT = 'ZERO_LOCK_ACQUISITION_TIMEOUT',
}

/**
 * Rest Utility class
 *
 * @author Katia Aresti
 */
export class RestUtils {
  private authenticationService: AuthenticationService;

  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
  }

  /**
   * Perform a REST call
   *
   * @param url
   * @param method
   */
  public restCall(
    url: string,
    method: string,
    accept?: string,
    customHeaders?: Headers,
    body?: string
  ): Promise<Response> {
    if (
      KeycloakService.Instance.isInitialized() ||
      this.authenticationService.isNotSecured()
    ) {
      let headers = customHeaders;
      if (!headers) {
        headers = this.createAuthenticatedHeader();
        if (accept && accept.length > 0) {
          headers.append('Accept', accept);
        }
      }
      let fetchOptions: RequestInit = {
        method: method,
        headers: headers,
        credentials: 'include',
      };
      if (body && body.length > 0) {
        fetchOptions['body'] = body;
      }
      return fetch(url, fetchOptions);
    } else {
      let digestFetchOptions = {
        method: method,
      };

      let digestFetchHeaders = {};
      if (accept && accept.length > 0) {
        digestFetchHeaders['Accept'] = accept;
      }

      if (customHeaders) {
        customHeaders.forEach(
          (value, key) => (digestFetchHeaders[key] = value)
        );
      }

      digestFetchOptions['headers'] = digestFetchHeaders;
      if (body && body.length > 0) {
        digestFetchOptions['body'] = body;
      }
      return this.authenticationService
        .getAuthenticatedClient()
        .fetch(url, digestFetchOptions);
    }
  }

  public createAuthenticatedHeader = (): Headers => {
    let headers = new Headers();
    if (KeycloakService.Instance.isInitialized()) {
      headers.append(
        'Authorization',
        'Bearer ' + localStorage.getItem('react-token')
      );
    }
    return headers;
  };

  public static isJSONObject(value: string): boolean {
    try {
      let jsonObj = JSON.parse(value);
      return jsonObj['_type'];
    } catch (err) {
      return false;
    }
  }

  /**
   * Handle a crud op request result
   *
   * @param name of the object
   * @param successMessage
   * @param response
   */
  public async handleCRUDActionResponse(
    successMessage: string,
    response: Promise<Response>
  ): Promise<ActionResponse> {
    return response
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw response;
      })
      .then((text) => {
        return <ActionResponse>{
          message: text == '' ? successMessage : text,
          success: true,
        };
      })
      .catch((err) => {
        if (err instanceof TypeError) {
          return <ActionResponse>{ message: err.message, success: false };
        }

        if (err instanceof Response) {
          return err
            .text()
            .then(
              (errorMessage) =>
                <ActionResponse>{
                  message: errorMessage ? errorMessage : err.statusText,
                  success: false,
                }
            );
        }
        return err
          .text()
          .then(
            (errorMessage) =>
              <ActionResponse>{ message: errorMessage, success: false }
          );
      });
  }

  public mapError(err: any, errorMessage: string): ActionResponse {
    if (err instanceof TypeError) {
      return <ActionResponse>{
        message: !errorMessage ? err.message : errorMessage,
        success: false,
      };
    }

    if (err instanceof Response) {
      if (err.status == 401) {
        return <ActionResponse>{
          message: 'Login failed. Check your credentials and try again.',
          success: false,
        };
      }
    }

    return err.text().then(
      (text) =>
        <ActionResponse>{
          message: text ? text : errorMessage,
          success: false,
        }
    );
  }

  /**
   * Calculate the key content type header value to send ot the REST API
   * @param contentType
   */
  public static fromContentType(contentType: ContentType): string {
    let stringContentType = '';
    switch (contentType) {
      case ContentType.StringContentType:
      case ContentType.DoubleContentType:
      case ContentType.IntegerContentType:
      case ContentType.LongContentType:
      case ContentType.BooleanContentType:
        stringContentType =
          'application/x-java-object;type=java.lang.' + contentType.toString();
        break;
      case ContentType.OctetStream:
        stringContentType = 'application/octet-stream';
        break;
      case ContentType.OctetStreamHex:
        stringContentType = 'application/octet-stream; encoding=hex';
        break;
      case ContentType.JSON:
        stringContentType = 'application/json';
        break;
      case ContentType.XML:
        stringContentType = 'application/xml';
        break;
      default:
        console.warn('Content type not mapped ' + contentType);
    }

    return stringContentType;
  }

  /**
   * Translate from string to ContentType
   *
   * @param contentTypeHeader
   * @param defaultContentType
   */
  public static toContentType(
    contentTypeHeader: string | null | undefined,
    defaultContentType?: ContentType
  ): ContentType {
    if (contentTypeHeader == null) {
      return defaultContentType
        ? defaultContentType
        : ContentType.StringContentType;
    }
    if (
      contentTypeHeader.startsWith('application/x-java-object;type=java.lang.')
    ) {
      const contentType = contentTypeHeader.replace(
        'application/x-java-object;type=java.lang.',
        ''
      );
      return contentType as ContentType;
    }

    if (contentTypeHeader == 'application/octet-stream') {
      return ContentType.OctetStream;
    }

    if (contentTypeHeader == 'application/octet-stream; encoding=hex') {
      return ContentType.OctetStreamHex;
    }

    if (contentTypeHeader == 'application/json') {
      return ContentType.JSON;
    }

    if (contentTypeHeader == 'application/xml') {
      return ContentType.XML;
    }

    return ContentType.StringContentType;
  }

  /**
   * Returns an array of two elements that tell if the cache is encoded (key/value) with
   * protobuf. If the result is [true, true], both key and value are encoded with protobuf
   * @param cacheConfig, the config of the cache in string
   * @return [boolean, boolean]
   */
  public static isProtobufCache(cacheConfig: string): boolean[] {
    const config = JSON.parse(cacheConfig);

    let cacheConfigHead;
    if (config.hasOwnProperty('distributed-cache')) {
      cacheConfigHead = config['distributed-cache'];
    } else if (config.hasOwnProperty('replicated-cache')) {
      cacheConfigHead = config['replicated-cache'];
    } else if (config.hasOwnProperty('invalidation-cache')) {
      cacheConfigHead = config['invalidation-cache'];
    } else if (config.hasOwnProperty('local-cache')) {
      cacheConfigHead = config['local-cache'];
    } else {
      return [false, false];
    }

    let keyProto = false;
    try {
      keyProto =
        cacheConfigHead.encoding.key['media-type'] ==
        'application/x-protostream';
    } catch (err) {
      // ignore
    }

    let valueProto = false;
    try {
      valueProto =
        cacheConfigHead.encoding.value['media-type'] ==
        'application/x-protostream';
    } catch (err) {
      // ignore
    }

    return [keyProto, valueProto];
  }

  /**
   *
   * @param protobufType
   */
  public static fromProtobufType(protobufType: string): ContentType {
    let contentType;

    switch (protobufType) {
      case 'string':
        contentType = ContentType.StringContentType;
        break;
      case 'float':
        contentType = ContentType.FloatContentType;
        break;
      case 'double':
        contentType = ContentType.DoubleContentType;
        break;
      case 'int32':
      case 'uint32':
      case 'sint32':
      case 'fixed32':
      case 'sfixed32':
        contentType = ContentType.IntegerContentType;
        break;
      case 'int64':
      case 'uint64':
      case 'sint64':
      case 'fixed64':
      case 'sfixed64':
        contentType = ContentType.LongContentType;
        break;
      case 'bool':
        contentType = ContentType.BooleanContentType;
        break;
      default:
        contentType = ContentType.StringContentType;
    }
    return contentType;
  }
}
