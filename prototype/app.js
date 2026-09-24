const routeData=[
  {status:'STATUS / SEARCH',code:'STEP / 01',title:'Подбираем автомобиль',text:'Сверяем модель, бюджет и требования. Формируем несколько вариантов для проверки.',a:'OUTPUT / SHORTLIST',b:'NEXT / CHECK'},
  {status:'STATUS / CHECKING',code:'STEP / 02',title:'Проверяем до покупки',text:'Проверяем состояние, документы, историю и соответствие выбранному варианту.',a:'OUTPUT / REPORT',b:'NEXT / BUY'},
  {status:'STATUS / PURCHASE',code:'STEP / 03',title:'Выкупаем автомобиль',text:'Фиксируем выбранный автомобиль и переводим сделку в этап выкупа.',a:'OUTPUT / PURCHASE',b:'NEXT / INSURANCE'},
  {status:'STATUS / INSURED',code:'STEP / 04',title:'Страхуем маршрут',text:'Фиксируем условия логистики и страхования до отправки автомобиля.',a:'OUTPUT / POLICY',b:'NEXT / BORDER'},
  {status:'STATUS / IN TRANSIT',code:'STEP / 05',title:'Доставляем к границе',text:'Автомобиль движется по согласованному маршруту. Статус обновляется по этапам.',a:'OUTPUT / TRACKING',b:'NEXT / CUSTOMS'},
  {status:'STATUS / CUSTOMS',code:'STEP / 06',title:'Проходим таможню',text:'Оформляем таможенные процедуры и готовим пакет документов для РФ.',a:'OUTPUT / CUSTOMS',b:'NEXT / EPTS'},
  {status:'STATUS / DOCUMENTS',code:'STEP / 07',title:'Получаем ЭПТС',text:'Завершаем документальную часть и готовим автомобиль к внутренней доставке.',a:'OUTPUT / EPTS',b:'NEXT / DELIVERY'},
  {status:'STATUS / READY',code:'STEP / 08',title:'Передаём автомобиль',text:'Автомобиль прибывает в конечный город и переходит к выдаче клиенту.',a:'OUTPUT / HANDOVER',b:'ROUTE / COMPLETE'}
];

const section=document.querySelector('[data-route-section]');
if(section){
  const steps=[...section.querySelectorAll('[data-route-steps] li')];
  const status=section.querySelector('[data-route-status]');
  const code=section.querySelector('[data-route-code]');
  const title=section.querySelector('[data-route-title]');
  const text=section.querySelector('[data-route-text]');
  const metaA=section.querySelector('[data-route-meta-a]');
  const metaB=section.querySelector('[data-route-meta-b]');
  const counter=section.querySelector('[data-route-counter]');
  const progress=section.querySelector('[data-route-progress]');
  let current=-1;

  const render=index=>{
    if(index===current)return;
    current=index;
    const item=routeData[index];
    steps.forEach((step,i)=>step.classList.toggle('is-active',i===index));
    status.textContent=item.status;
    code.textContent=item.code;
    title.textContent=item.title;
    text.textContent=item.text;
    metaA.textContent=item.a;
    metaB.textContent=item.b;
    counter.textContent=String(index+1).padStart(2,'0')+' / 08';
    progress.style.width=((index+1)/routeData.length*100)+'%';
  };

  const update=()=>{
    const rect=section.getBoundingClientRect();
    const max=section.offsetHeight-window.innerHeight;
    const passed=Math.min(Math.max(-rect.top,0),max);
    const ratio=max>0?passed/max:0;
    const index=Math.min(routeData.length-1,Math.floor(ratio*routeData.length));
    render(index);
  };
  update();
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
}

document.querySelectorAll('[data-choice]').forEach(group=>{
  group.addEventListener('click',event=>{
    const button=event.target.closest('.choice');
    if(!button)return;
    group.querySelectorAll('.choice').forEach(item=>item.classList.remove('is-active'));
    button.classList.add('is-active');

    const type=group.dataset.choice;
    const map={model:'[data-selected-model]',power:'[data-selected-power]',budget:'[data-selected-budget]'};
    const target=document.querySelector(map[type]);
    if(target)target.textContent=button.dataset.value;
  });
});

const city=document.querySelector('[data-city]');
const selectedCity=document.querySelector('[data-selected-city]');
if(city&&selectedCity){
  city.addEventListener('input',()=>selectedCity.textContent=city.value.trim()||'Город');
}

document.querySelectorAll('.faq-item button').forEach(button=>{
  button.addEventListener('click',()=>{
    const item=button.closest('.faq-item');
    const open=item.classList.toggle('is-open');
    button.setAttribute('aria-expanded',String(open));
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
});
