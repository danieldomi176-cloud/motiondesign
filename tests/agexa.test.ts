import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAgexa} from '../scripts/agexa/validate';
import {brand} from '../src/agexa/brand';
test('AGEXA permite versão conceptual e rejeita aprovação de telas sem capturas oficiais',()=>{
 assert.deepEqual(validateAgexa({...brand,assetsVerified:false},()=>true),[]);
 assert.match(validateAgexa({...brand,assetsVerified:true,clientScreens:[],businessScreens:[]},()=>true).join(' '),/telas oficiais/);
});
test('AGEXA rejeita recursos fora de public e contactos de conversão inconsistentes',()=>{
 const errors=validateAgexa({...brand,clientScreens:['../../.env'],whatsappUrl:'https://wa.me/123',website:'outro.example'},()=>true);
 assert.ok(errors.some(e=>e.includes('fora de public')));
 assert.ok(errors.some(e=>e.includes('WhatsApp')));
 assert.ok(errors.some(e=>e.includes('Website')));
});
