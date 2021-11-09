/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import type {
  ButtonInteraction,
  Client,
  DMChannel,
  Message,
  MessageActionRowComponent,
  MessageActionRowComponentResolvable,
  MessageButtonStyle,
  PartialMessage,
  TextChannel,
  ThreadChannel,
  User,
} from 'discord.js';
import { MessageComponentTypes } from 'discord.js/typings/enums';

import { AWAIT_MESSAGE_TIMEOUT } from '../../env';
import { ExternalResolver } from './ExternalResolver';

export type QuestionBase = {
  body: string;
  next?: (value: unknown, state: unknown) => string | undefined | symbol;
};

export type ButtonQuestion = {
  type: 'button';
  buttons: readonly {
    label: string;
    value: string;
    style?: MessageButtonStyle;
  }[];
buttonDelay?: number;
} & QuestionBase;

export type TextQuestion = {
  type: 'text';
  validate?: (input: string) => boolean | string;
  format?: (input:string) => string
} & QuestionBase;

export type MultiStepFormStep = ButtonQuestion | TextQuestion;

const __cancelled__ = Symbol('cancelled');

export class MultistepForm<T extends Record<string, MultiStepFormStep>> {
  static cancelled = __cancelled__;

  #steps: T;

  #id: string = Math.random().toString(16);

  #channel: TextChannel | DMChannel | ThreadChannel;

  #user: User;

  public constructor(
    steps: Readonly<T>,
    channel: TextChannel | DMChannel | ThreadChannel,
    user: User
  ) {
    this.#steps = steps;
    this.#channel = channel;
    this.#user = user;
  }

  public async getButtonResponse<P extends ButtonQuestion>(
    step: P
  ): Promise<P['buttons'][number]['value'] | typeof __cancelled__> {
    const resolver = new ExternalResolver<P['buttons'][number]['value'] | typeof __cancelled__>();
    const message = await this.#channel.send({
      content: step.body,
      components: [
        {
          type: 'ACTION_ROW',
          components: this.genButtons<P>(step, !!step.buttonDelay),
        },
      ],
    });

    if (step.buttonDelay) {
      setTimeout(() => {
        message.edit({
          components: [
            {
              type: 'ACTION_ROW',
              components: this.genButtons<P>(step),
            },
          ],
        });
      }, step.buttonDelay);
    }

    const collector =
      message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: interaction => interaction.user.id === this.#user.id,
      });

    const handler = async (interaction: ButtonInteraction) => {
      if (interaction.isButton()) {
        const [id, value] = interaction.customId.split('🤔');

        if (id !== this.#id) {
          return;
        }

        collector.off('collect', handler);
        await interaction.deferUpdate();
        interaction.editReply({
          content: `${step.body}\n${
            step.buttons.find(({ value: val }) => val === value).label
          }`,
          components: [],
        });
        resolver.resolve(value);
      }
    };

    collector.on('collect', handler);
    setTimeout(() => {
      if(resolver.settled) return

      collector.off('collect', handler)
      resolver.resolve(__cancelled__)
      message.edit({
        components: []
      })
      message.channel.send("Timed out. Please restart the process.")
    },  Number(AWAIT_MESSAGE_TIMEOUT) * 1000 )
    return resolver;
  }

  public async getTextResponse<P extends TextQuestion>(
    step: P
  ): Promise<string | typeof __cancelled__> {
    const resolver = new ExternalResolver<string>();
    const message = await this.sendWithCancel(
      `${step.body}\n\nOr click below to cancel.`
    );

    const deleteResolver = new ExternalResolver<typeof __cancelled__>();

    const handleDelete = (msg: Message | PartialMessage) => {
      if (msg.id !== message.id) {
        return;
      }

      this.#channel.client.off('messageDelete', handleDelete);
      deleteResolver.resolve(__cancelled__);
    };

    this.#channel.client.on('messageDelete', handleDelete);

    try {
      const userId = this.#user.id;
      const res = await Promise.race([
        this.#channel.awaitMessages({
          time: Number.parseInt(AWAIT_MESSAGE_TIMEOUT) * 1000,
          filter: (message) => {
            const value = step.validate(message.cleanContent)
            const fromUser = message.author.id === userId

            if(typeof value === 'string' && fromUser) {
              this.#channel.send(value)
            }

            return (
              fromUser &&
              typeof value === 'boolean' && value
            );
          },
          max: 1,
        }),
        deleteResolver,
      ]);

      // cleanup
      this.#channel.client.off('messageDelete', handleDelete);

      if (res === __cancelled__) {
        return __cancelled__;
      }

      const value = res.first().content.trim()
      return step.format?.(value) ?? value;
    } catch {
      this.#channel.send(`You have timed out. Please try again`);
    }

    return resolver;
  }

  public async getResult(startStep: keyof T): Promise<Map<keyof T, unknown>> {
    let currentStep: keyof T | typeof __cancelled__ = startStep;

    const state: Map<keyof T, unknown> = new Map();

    while (currentStep !== undefined && currentStep !==__cancelled__&& currentStep in this.#steps) {
      const step = this.#steps[currentStep];
      let value;
      if (step.type === 'button') {
        value = await this.getButtonResponse(step);
        if (value === __cancelled__) {
          return null;
        }
        state.set(currentStep, value);
      } else {
        value = await this.getTextResponse(step);
        if (value === __cancelled__) {
          return null;
        }
        state.set(currentStep, value);
      }

      currentStep = step?.next?.(value, state);
    }
    return currentStep !== __cancelled__ ? state : null;
  }

  private genButtons<P extends ButtonQuestion>(
    step: P,
    disabled?: boolean
  ): MessageActionRowComponentResolvable[] {
    return step.buttons.map(
      (button): MessageActionRowComponentResolvable => ({
        type: 'BUTTON',
        label: button.label,
        style: button.style ?? 'PRIMARY',
        customId: `${this.#id}🤔${button.value}`,
        disabled: disabled ?? undefined
      })
    );
  }

  private async sendWithCancel(content: string): Promise<Message> {
    const messageId = Math.random().toString(16);

    const message = await this.#channel.send({
      content,
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              label: 'Cancel',
              style: 'DANGER',
              customId: `${this.#id}🤔${messageId}`,
            },
          ],
        },
      ],
    });

    const collector =
      message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: interaction => interaction.user.id === this.#user.id,
      });

    const handler = (interaction: ButtonInteraction) => {
      if (interaction.isButton()) {
        const [id, cancelId] = interaction.customId.split('🤔');
        // console.log({id, cancelId, selfId: this.#id, message})
        if (messageId !== cancelId || id !== this.#id) {
          return;
        }
        collector.off('collect', handler);
        message.delete();
        message.channel.send('Cancelled');
      }
    };

    collector.on('collect', handler);

    return message;
  }
}
