/**
 * Base configuration for a server.
 */
export class ServerConfiguration {
  static SCHEMA = {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        default: '0.0.0.0',
      },
      port: {
        type: 'number',
        default: 8080,
      },
    },
  };

  /**
   * Creates a new server configuration.
   *
   * @param {string} [address="0.0.0.0"] the host address.
   * @param {number} [port=8080] the port number.
   */
  constructor(address = '0.0.0.0', port = 8080) {
    this.address = address;
    this.port = port;
  }
}
