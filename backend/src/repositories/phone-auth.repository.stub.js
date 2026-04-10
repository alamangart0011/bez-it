export const phoneAuthRepositoryStub = {
  async createOtpCode() {
    throw new Error('phoneAuthRepository.createOtpCode is not wired yet');
  },
  async findRecentOtp() {
    throw new Error('phoneAuthRepository.findRecentOtp is not wired yet');
  },
  async findLatestValidOtp() {
    throw new Error('phoneAuthRepository.findLatestValidOtp is not wired yet');
  },
  async incrementOtpAttempts() {
    throw new Error('phoneAuthRepository.incrementOtpAttempts is not wired yet');
  },
  async markOtpUsed() {
    throw new Error('phoneAuthRepository.markOtpUsed is not wired yet');
  },
  async findVerifiedPhone() {
    throw new Error('phoneAuthRepository.findVerifiedPhone is not wired yet');
  },
  async listUserPhones() {
    throw new Error('phoneAuthRepository.listUserPhones is not wired yet');
  },
  async upsertVerifiedPhone() {
    throw new Error('phoneAuthRepository.upsertVerifiedPhone is not wired yet');
  },
  async deleteUserPhone() {
    throw new Error('phoneAuthRepository.deleteUserPhone is not wired yet');
  },
  async countVerifiedPhones() {
    throw new Error('phoneAuthRepository.countVerifiedPhones is not wired yet');
  },
  async touchTrustedDevice() {
    throw new Error('phoneAuthRepository.touchTrustedDevice is not wired yet');
  }
};
