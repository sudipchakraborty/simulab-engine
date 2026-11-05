/** @file blink-uart.c
 * @brief Genuine ATmega328P fixture: Timer1 ISR toggles a GPIO and UART0 reports state.
 * @details This source is compiled with AVR-GCC; SimuLab executes the generated instructions.
 * Timer1 CTC: 16 MHz / 256 / (15624 + 1) = 4 Hz, so the LED toggles every 250 ms.
 * LED_BIT is PB5 (Uno D13) by default; compile with -DLED_BIT=PB4 for Uno D12.
 */
#define F_CPU 16000000UL
#include <avr/io.h>
#include <avr/interrupt.h>
#include <stdint.h>
#ifndef LED_BIT
#define LED_BIT PB5
#endif
static volatile uint8_t ticks;
/** @brief Send one UART0 byte using the actual transmitter data-register-empty flag. */
static void uart_put(char c) {
  while (!(UCSR0A & _BV(UDRE0))) {}
  UDR0 = (uint8_t)c;
}
/** @brief Transmit a zero-terminated message. */
static void uart_print(const char *s) { while (*s) uart_put(*s++); }
/** @brief Compare-match interrupt drives the output pin; UI timing is not involved. */
ISR(TIMER1_COMPA_vect) {
  PORTB ^= _BV(LED_BIT);
  ticks++;
}
/** @brief Configure hardware registers and report each observed timer transition. */
int main(void) {
  DDRB |= _BV(LED_BIT);
  PORTB &= (uint8_t)~_BV(LED_BIT);
  UBRR0H = 0;
  UBRR0L = 103; /* 16 MHz / (16 * (103 + 1)) = 9615.38 baud, standard 9600 configuration. */
  UCSR0A = 0;
  UCSR0B = _BV(TXEN0);
  UCSR0C = _BV(UCSZ01) | _BV(UCSZ00);
  TCCR1A = 0;
  TCCR1B = _BV(WGM12);
  TCNT1 = 0;
  OCR1A = 15624;
  TIMSK1 = _BV(OCIE1A);
  TCCR1B |= _BV(CS12); /* divide by 256 */
  sei();
  uart_print("SIMULAB AVR READY\n");
  uint8_t seen = 0;
  for (;;) {
    if (ticks != seen) {
      seen = ticks;
      uart_print((PORTB & _BV(LED_BIT)) ? "LED ON\n" : "LED OFF\n");
    }
  }
}
