import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  effect,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { ChatMessage } from './models/chat.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <header
        class="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center border-b dark:border-gray-700"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png"
          alt="Govt of India Logo"
          class="h-12 mr-4"
        />
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white">
            Samarth AI
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Agricultural & Climate Data Analyst
          </p>
        </div>
      </header>

      <main #chatContainer class="flex-1 overflow-y-auto p-6 space-y-6">
        @for (message of messages(); track $index) {
        <div
          [class]="'flex items-start gap-4 ' + (message.role === 'user' ? 'justify-end' : 'justify-start')"
        >
          @if (message.role === 'model') {
            <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                AI
            </div>
          }
          <div
            [class]="'max-w-3xl p-4 rounded-lg shadow-sm ' + (message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 dark:text-gray-200')"
          >
            @if (message.role === 'model') {
              <div
                class="prose dark:prose-invert max-w-none"
                [innerHTML]="renderMarkdown(message.content)"
              ></div>
              @if (isLoading() && $index === messages().length - 1) {
              <div class="flex items-center justify-center pt-2">
                <div
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"
                ></div>
              </div>
              } 
            } @else {
              <p>{{ message.content }}</p>
            }
          </div>
        </div>
        }
      </main>

      <footer class="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700">
        <form
          [formGroup]="chatForm"
          (ngSubmit)="onSendMessage()"
          class="flex items-center space-x-4 max-w-4xl mx-auto"
        >
          <input
            formControlName="message"
            type="text"
            placeholder="Ask a question about India's agricultural economy..."
            class="flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            [attr.disabled]="isLoading() ? true : null"
          />
          <button
            type="submit"
            [disabled]="chatForm.invalid || isLoading()"
            class="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
          >
            @if(isLoading()){
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
            } @else {
            <span>Send</span>
            }
          </button>
        </form>
      </footer>
    </div>
  `,
  styles: [
    `
      /* Custom styles for rendered HTML from Gemini */
      :host ::ng-deep table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      :host ::ng-deep th,
      :host ::ng-deep td {
        border: 1px solid #e2e8f0; /* gray-200 */
        padding: 0.75rem;
        text-align: left;
      }
      :host ::ng-deep th {
        background-color: #f7fafc; /* gray-50 */
        font-weight: 600;
        font-size: 0.875rem;
      }
      :host ::ng-deep .dark th {
        background-color: #2d3748; /* gray-800 */
        border-color: #4a5568; /* gray-600 */
        color: #e2e8f0; /* gray-200 */
      }
      :host ::ng-deep .dark td {
        border-color: #4a5568; /* gray-600 */
      }
      :host ::ng-deep tr:nth-child(even) {
        background-color: #f7fafc; /* gray-50 */
      }
       :host ::ng-deep .dark tr:nth-child(even) {
        background-color: #2d3748; /* gray-800 */
      }

      /* Basic prose styles for markdown */
      :host ::ng-deep .prose h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0; /* gray-200 */
        padding-bottom: 0.5rem;
      }
       :host ::ng-deep .dark .prose h3 {
         border-color: #4a5568; /* gray-600 */
       }
      :host ::ng-deep .prose ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-bottom: 1rem;
      }
      :host ::ng-deep .prose strong {
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly #geminiService = inject(GeminiService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly chatContainer =
    viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  messages = signal<ChatMessage[]>([
    {
      role: 'model',
      content:
        "Welcome to Samarth AI. How can I help you analyze India's agricultural and climate data today?",
    },
  ]);
  isLoading = signal(false);

  chatForm = new FormGroup({
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      // This effect runs whenever the messages signal changes,
      // and scrolls the chat container to the bottom.
      if (this.messages()) {
        this.scrollToBottom();
      }
    });
  }

  async onSendMessage(): Promise<void> {
    if (this.chatForm.invalid) {
      return;
    }

    const prompt = this.chatForm.controls.message.value;
    this.chatForm.reset();

    this.messages.update((current) => [
      ...current,
      { role: 'user', content: prompt },
    ]);
    this.isLoading.set(true);

    this.messages.update((current) => [
      ...current,
      { role: 'model', content: '' },
    ]);

    try {
      const stream = this.#geminiService.sendMessage(prompt);
      for await (const chunk of stream) {
        this.messages.update((current) => {
          const lastMessage = current[current.length - 1];
          lastMessage.content += chunk;
          return [...current];
        });
      }
    } catch (e) {
      console.error(e);
      this.messages.update((current) => {
        const lastMessage = current[current.length - 1];
        lastMessage.content =
          'An error occurred. Please check the console for more details.';
        return [...current];
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  renderMarkdown(content: string): SafeHtml {
    // A simple markdown-to-HTML converter that handles what the AI was prompted to produce.
    // WARNING: This is not a full-featured or secure markdown parser.
    // It is designed to work only with the expected output from the Gemini service.
    let html = content;

    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Headings: ### text -> <h3>text</h3>
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    // List items: * item -> <li>item</li> (and wrap in <ul>)
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s?<ul>/g, '');

    // The Gemini prompt instructs it to use HTML for tables,
    // so we trust and sanitize that output.
    return this.#sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.chatContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
