export type MockFhirClientOptions = {
  getReturn?: unknown;
  postReturn?: unknown;
  accessToken?: string;
  requestLog?: unknown[];
  postJsonReturn?: unknown;
};

export const defaultFhirResponses = {
  getReturn: {
    status: 200,
    resourceType: "Bundle",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "test-patient-123",
          name: [{ given: ["Test"], family: "Patient" }],
          identifier: [{ value: "MRN-12345" }],
        },
      },
    ],
  },
  postReturn: {
    status: 200,
    url: "http://mock-server.com/fhir",
    text: jest.fn().mockResolvedValue(""),
    json: jest.fn().mockResolvedValue({
      resourceType: "Bundle",
      entry: [],
    }),
    headers: new Headers(),
  },
  accessToken: "mock-token",
  requestLog: [],
  postJsonReturn: {},
};

export const createFhirClientMock = (overrides: MockFhirClientOptions = {}) => {
  const options = { ...defaultFhirResponses, ...overrides };

  const mockGet = jest.fn().mockResolvedValue(options.getReturn);
  const mockPost = jest.fn().mockResolvedValue(options.postReturn);
  const mockGetAccessToken = jest.fn().mockResolvedValue(options.accessToken);
  const mockEnsureValidToken = jest.fn().mockResolvedValue(undefined);
  const mockGetRequestLog = jest.fn().mockReturnValue(options.requestLog);
  const mockPostJson = jest.fn().mockReturnValue(options.postJsonReturn);

  const mockConstructor = jest.fn().mockImplementation(() => ({
    get: mockGet,
    post: mockPost,
    getAccessToken: mockGetAccessToken,
    ensureValidToken: mockEnsureValidToken,
    getRequestLog: mockGetRequestLog,
    postJson: mockPostJson,
  }));

  return {
    mockConstructor,
    get: mockGet,
    post: mockPost,
    getAccessToken: mockGetAccessToken,
    ensureValidToken: mockEnsureValidToken,
    getRequestLog: mockGetRequestLog,
    postJson: mockPostJson,
  };
};

let defaultMocks = createFhirClientMock();

export const resetFhirMockState = () => {
  defaultMocks = createFhirClientMock();
  jest.clearAllMocks();
};

export default defaultMocks.mockConstructor;
