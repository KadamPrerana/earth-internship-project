/* ============================================================
   __mocks__/axios.js — Manual Mock for Axios
   ============================================================
   Jest automatically uses this file when 'axios' is imported
   in any test. It provides mock versions of all axios methods
   and the interceptors that services/api.js uses.
   ============================================================ */

const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: {
        baseURL: '',
        headers: { common: {} },
    },
    interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
    },
};

module.exports = mockAxios;
module.exports.default = mockAxios;
