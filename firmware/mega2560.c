#include <avr/io.h>
#include <avr/interrupt.h>
volatile uint8_t ticks;
ISR(TIMER1_COMPA_vect) { PORTB ^= _BV(PB7); ticks++; }
int main(void) {
 DDRB |= _BV(PB7); DDRL |= _BV(PL0); PORTL |= _BV(PL0);
 DDRK |= _BV(PK0); PORTK |= _BV(PK0); DDRG |= _BV(PG5);
 UBRR0=103; UCSR0B=_BV(TXEN0)|_BV(RXEN0); UCSR0C=_BV(UCSZ01)|_BV(UCSZ00);
 TCCR1A=0; TCCR1B=_BV(WGM12)|_BV(CS12); OCR1A=15624; TIMSK1=_BV(OCIE1A); sei();
 const char *s="MEGA2560 REAL UART\n";while(*s){while(!(UCSR0A&_BV(UDRE0))){} UDR0=*s++;}
 for(;;){if(PINE&_BV(PE4))PORTG|=_BV(PG5);else PORTG&=~_BV(PG5);if(UCSR0A&_BV(RXC0)){uint8_t c=UDR0;while(!(UCSR0A&_BV(UDRE0))){}UDR0=c;}}
}
