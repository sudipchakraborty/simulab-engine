#include <avr/io.h>
#include <util/delay.h>
int main(void) {
 DDRB |= _BV(PB0) | _BV(PB3);
 PORTB &= ~_BV(PB0);
 _delay_us(5);
 const int low = !(PIND & _BV(PD2));
 PORTB |= _BV(PB0);
 _delay_us(5);
 if (low && (PIND & _BV(PD2))) PORTB |= _BV(PB3);
 for (;;) {}
}
