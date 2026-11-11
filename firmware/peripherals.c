#include <avr/io.h>
#include <stdint.h>
static void tw(uint8_t v) { TWDR=v; TWCR=_BV(TWINT)|_BV(TWEN); while(!(TWCR&_BV(TWINT))){} }
int main(void) {
 UBRR0=103; UCSR0B=_BV(RXEN0)|_BV(TXEN0); UCSR0C=_BV(UCSZ01)|_BV(UCSZ00);
 DDRD|=_BV(PD6); TCCR0A=_BV(COM0A1)|_BV(WGM01)|_BV(WGM00); TCCR0B=_BV(CS01); OCR0A=64;
 DDRB|=_BV(PB3); TCCR2A=_BV(COM2A0)|_BV(WGM21); TCCR2B=_BV(CS22); OCR2A=124;
 TWBR=72; TWCR=_BV(TWINT)|_BV(TWSTA)|_BV(TWEN);while(!(TWCR&_BV(TWINT))){}
 tw(0x68<<1);tw(0);TWCR=_BV(TWINT)|_BV(TWSTO)|_BV(TWEN);
 TWCR=_BV(TWINT)|_BV(TWSTA)|_BV(TWEN);while(!(TWCR&_BV(TWINT))){}
 tw((0x68<<1)|1);TWCR=_BV(TWINT)|_BV(TWEN);while(!(TWCR&_BV(TWINT))){}
 uint8_t read=TWDR;TWCR=_BV(TWINT)|_BV(TWSTO)|_BV(TWEN);
 while(!(UCSR0A&_BV(UDRE0))){} UDR0=read;
 for(;;){if(UCSR0A&_BV(RXC0)){uint8_t v=UDR0;while(!(UCSR0A&_BV(UDRE0))){} UDR0=v;}}
}
