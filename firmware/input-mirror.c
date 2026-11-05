/** @file input-mirror.c @brief Actual ATmega328P instructions mirror input D2 onto output D11. */
#define F_CPU 16000000UL
#include <avr/io.h>
/** @brief Configure PD2 input with pullup, then mirror its sampled register bit to PB3. */
int main(void) {
  DDRD &= (unsigned char)~_BV(PD2);
  PORTD |= _BV(PD2);
  DDRB |= _BV(PB3);
  for (;;) {
    if (PIND & _BV(PD2)) PORTB |= _BV(PB3);
    else PORTB &= (unsigned char)~_BV(PB3);
  }
}
