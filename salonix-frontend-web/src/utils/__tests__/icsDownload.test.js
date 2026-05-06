import { downloadICSSecure, openICSSecure } from '../icsDownload';

describe('icsDownload utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadICSSecure', () => {
    it('should throw if parameters are missing', async () => {
      await expect(
        downloadICSSecure(null, 1, 'token', 'file.ics')
      ).rejects.toThrow('Missing required parameters for ICS download');

      await expect(
        downloadICSSecure('http://api/', null, 'token', 'file.ics')
      ).rejects.toThrow('Missing required parameters for ICS download');

      await expect(
        downloadICSSecure('http://api/', 1, null, 'file.ics')
      ).rejects.toThrow('Missing required parameters for ICS download');
    });

    it('should make POST request with X-ICS-Token header', async () => {
      const mockBlob = new Blob(['ICS CONTENT'], { type: 'text/calendar' });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValueOnce(mockBlob),
      });

      try {
        await downloadICSSecure(
          'http://api/',
          123,
          'test-token',
          'appointment.ics'
        );
      } catch (e) {
        // Expected - we just verify fetch was called correctly
      }

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api/public/appointments/123/ics/',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'X-ICS-Token': 'test-token',
            'Content-Type': 'application/json',
          },
          referrerPolicy: 'no-referrer',
        })
      );
    });

    it('should throw on HTTP error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(
        downloadICSSecure(
          'http://api/',
          123,
          'invalid-token',
          'appointment.ics'
        )
      ).rejects.toThrow('HTTP error! status: 403');
    });

    it('should throw on fetch error', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        downloadICSSecure('http://api/', 123, 'token', 'appointment.ics')
      ).rejects.toThrow('Network error');
    });
  });

  describe('openICSSecure', () => {
    it('should log error if parameters are missing', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      openICSSecure(null, 1, 'token');
      openICSSecure('http://api/', null, 'token');
      openICSSecure('http://api/', 1, null);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Missing required parameters for ICS open'
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
