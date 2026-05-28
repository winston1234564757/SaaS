import { Page, Locator } from '@playwright/test';

export class MarketingPage {
  readonly page: Page;
  readonly newBroadcastBtn: Locator;
  readonly broadcastTitleInput: Locator;
  readonly broadcastMessageTextarea: Locator;
  readonly previewBtn: Locator;
  readonly confirmSendBtn: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newBroadcastBtn = page.getByTestId('new-broadcast-btn');
    this.broadcastTitleInput = page.getByTestId('broadcast-title-input');
    this.broadcastMessageTextarea = page.getByTestId('broadcast-message-textarea');
    this.previewBtn = page.getByTestId('preview-broadcast-btn');
    this.confirmSendBtn = page.getByTestId('confirm-send-btn');
    this.successToast = page.getByTestId('broadcast-success-toast');
  }

  async goto() {
    await this.page.goto('/dashboard/marketing');
  }

  async openBroadcastTab() {
    await this.page.click('button:has-text("Розсилки")');
  }
}
