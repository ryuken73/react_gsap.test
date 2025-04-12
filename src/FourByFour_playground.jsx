import React, { act } from 'react';
import styled from 'styled-components';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(useGSAP)
gsap.registerPlugin(Flip)

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: stretch;
  justify-content: center;
`
const Box = styled.div`
  background: ${props => colors[props.itemId]};
  cursor: pointer;
  color: white;
  padding: 10px;
  font-size: 20px;
  width: calc(48.5% - 0.5rem);
  order: ${props => props.itemId};
`

const data = ['1층', '2층', '3층', '4층']
const colors = ['black', 'grey', 'blue', 'maroon']
const NEXT_INDEX_MAP = {
  0: 1,
  1: 3,
  3: 2,
  2: 0
}

const TRANSLATE_FACTOR = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];


export default React.memo(function FourByFour() {
  const topRef = React.useRef(null);
  const boxRefs = React.useRef([]);
  const orderedBoxRef = React.useRef([]);
  const [activeId, setActiveId] = React.useState(null);
  const [lastClickTime, setLastClickTime] = React.useState(null);
  const [lastButtonClickTime, setLastButtonClickTime] = React.useState(null);

  const [flipState, setFlipState] = React.useState(null);
  const zIndexRef = React.useState(0);

  const activeOrderNumber = React.useMemo(() => {
    if(activeId === null){
      return null
    }
    const activeBox = boxRefs.current.find(box => {
      return box.id === activeId 
    });
    return window.getComputedStyle(activeBox).order
  }, [activeId]) 

  console.log('activeId', activeId)
  console.log('activeOrder Number', activeOrderNumber)

  const {contextSafe} = useGSAP({scope: topRef.current})

  // React.useEffect(() => {
  //   let ctx = gsap.context(() => {
  //     // gsap.to(boxRefs.current[0], {rotation: 360})
  //     // gsap.to(boxRefs.current[0], {x: 200})
  //   })
  // }, [])
  const getNextIndex = (id) => {
    return NEXT_INDEX_MAP[id]
  }
  const getNextOrder = (boxElement) => {
    const style = window.getComputedStyle(boxElement)
    return NEXT_INDEX_MAP[parseInt(style.order)];
  }
  const reorderBoxRef = (array) => {
    return [
      array[2],
      array[0],
      array[3],
      array[1]
    ]
  }

  const makeStagger = (shouldStartFirstIndex) => {
    return (index, target, list) => {
      const cssStyle = window.getComputedStyle(target)
      if(parseInt(shouldStartFirstIndex) === parseInt(cssStyle.order)){
        return 0
      }
      const order = [0, 1, 3, 2];
      
      // activeId의 인덱스 찾기
      const activeIndex = order.indexOf(parseInt(shouldStartFirstIndex));
      
      // input의 인덱스를 순서에 따라 계산
      let inputIndex = order.indexOf(parseInt(cssStyle.order));

      
      // activeId 이후의 순서를 계산하기 위해 인덱스 조정
      inputIndex = (inputIndex - activeIndex + order.length) % order.length;
      console.log('########## should', shouldStartFirstIndex, cssStyle.order, activeIndex, inputIndex)
      
      const weights = [0, 0.1, 0.25, 0.4];
      // activeId와 일치하지 않는 경우, 순서에 따라 0.1씩 증가
      console.log('duraion:', inputIndex*0.3)
      return weights[inputIndex] ;
    }
  }

  useGSAP(() => {
    if(activeId == null) {
      return;
    }
    const target = boxRefs.current[activeId]
    const style = getComputedStyle(target)
    console.log(`id=${target.id}, order=${style.order}`)
    const translateFactor = TRANSLATE_FACTOR[style.order]
    gsap.to(target, {scale: 2, x: `${translateFactor[0]*50}%`, y:`${translateFactor[1]*50}%`, duration: 0.5})

  }, {scope: topRef.current, dependencies:[activeId], revertOnUpdate: true})

  useGSAP(() => {
    // 1개 box control
    // const target = boxRefs.current[0]
    // gsap.to(target, {x: 200})
    // gsap.to(target, {width: '50%', height: '50%'})
    // gsap.to(target, {translateZ: '50px' , height: '50%'})

    // 전체 box 움직이기
    // const target = boxRefs.current;
    // gsap.to(allTargets.current, {x: 200})
    // gsap.to(target, {width: '50%', height: '50%'})

    // state 연동, 클릭 시 target에 animation

    // gsap.to(target, {scale: '2' , rotate: 360 })
    // gsap.to(target, {backgroundColor: 'maroon' , rotate: 360 })

    // 클릭 시 해당 box를 다음 박스로 이동
    if(lastClickTime === null){
      return
    }
    // const from = boxRefs.current[activeId];
    // const nextIndex = parseInt(activeId) + 1 === boxRefs.current.length ? 0:parseInt(activeId) + 1;
    // const to = boxRefs.current[nextIndex]

    // Flip.fit(from, to, {
    //   duration: 1,
    //   ease: 'poweri.inOut',
    //   scale: true
    // })

    // 클릭 시 모든 box를 다음 box로 이동 (using Flip.fit)
    // 두번째 누르면 잘 안됨. 왜냐하면 boxRefs.current가 re-render되어서 예전과 동일하기 때문
    // boxRefs.current.forEach((box, i) => {
    //   // const nextIndex = parseInt(i) + 1 === boxRefs.current.length ? 0:parseInt(i) + 1;
    //   console.log(i, box.id)
    //   const nextIndex = getNextIndex(i)
    //   const to = boxRefs.current[nextIndex]
    //   Flip.fit(box, to, {
    //     duration: 1,
    //     ease: 'poweri.inOut',
    //     scale: true
    //   })
    // })
    // console.log(boxRefs.current)
    // // boxRefs.current = reorderBoxRef(boxRefs.current)
    // boxRefs.current = []
    // console.log(boxRefs.current)

    // Flip.from으로 해보자.
    boxRefs.current.forEach(box => {
      console.log('before', box.id, window.getComputedStyle(box).order)
      console.log(flipState)
    })
    const state = flipState === null ? Flip.getState(boxRefs.current, {props: "order"}) : flipState;
    console.log(state)
    boxRefs.current.forEach((box, i) => {
      const nextOrder = getNextOrder(box)
      box.style.order = nextOrder
    })
    const masterTimeline = gsap.timeline();
    const flipTimeline = Flip.from(state, {
      duration: 0.5,
      // stagger: {
      //   from: activeId,
      //   amount : 1
      // },
      stagger: makeStagger(activeOrderNumber),
      absolute: true,
      onComplete: () => {
        setActiveId(null)
        setFlipState(Flip.getState(boxRefs.current, {props: "order"}))
        boxRefs.current = reorderBoxRef(boxRefs.current)
      }
    })
    masterTimeline.pause();
    masterTimeline.add(flipTimeline)
    // masterTimeline.add(gsap.to(boxRefs.current, {scale: 0.7, duration: 0.1}), "<")
    // masterTimeline.add(gsap.to(boxRefs.current, {scale: 1, duration: 0.1}), "<+0.1")
    masterTimeline.play();


    // 일반 값에 적용
    // let obj = { num: 10, color: 'blue' }
    // gsap.to(obj, {
    //   num: 200,
    //   color: 'yellow',
      // onUpdate: () => console.log(obj)
    // })

  }, {scope: topRef.current, dependencies:[lastClickTime], revertOnUpdate: true})

  // const onClickBox = contextSafe(() => {
  // }, [])

  const gsapScaleDown = contextSafe((id) => {
    const target = boxRefs.current[id]
    console.log(target)
    gsap.to(target, {
      scale: 1, 
      x: '0', 
      y:'0', 
      duration: 0.5,
      onComplete: () => {
        setLastClickTime(Date.now())
        // boxRefs.current.forEach(box => {
        //   console.log('before', box.id, window.getComputedStyle(box).order)
        //   console.log(flipState)
        // })
        // const state = flipState === null ? Flip.getState(boxRefs.current, {props: "order"}) : flipState;
        // boxRefs.current.forEach((box, i) => {
        //   const nextOrder = getNextOrder(box)
        //   box.style.order = nextOrder
        // })
        // Flip.from(state, {
        //   duration: 0.3,
        //   stagger: 0.1,
        //   absolute: true,
        //   onComplete: () => {
        //     console.log(boxRefs.current)
        //     setFlipState(Flip.getState(boxRefs.current, {props: "order"}))
        //   }
        // })
      }
    })
  })

  const onClickBox = React.useCallback(() => {
    setLastClickTime(Date.now())
  }, [])

  const scaleUp = React.useCallback((event) => {
    event.stopPropagation();
    const {id} = event.target;
    console.log('click:', id);
    event.target.parentNode.style.zIndex = zIndexRef.current + 1;
    setActiveId(id)
  }, [zIndexRef])

  const scaleDown = React.useCallback((event) => {
    event.stopPropagation();
    const {id} = event.target;
    gsapScaleDown(id)
  }, [gsapScaleDown])

  return (
    <Container
      ref={topRef}
    >
      {data.map((stage, i) => (
        <Box
          onClick={onClickBox}
          key={i}
          id={i}
          itemId={i}
          ref={el => boxRefs.current[i] = el}
        >{stage}
          <button id={i} onClick={scaleUp}>scaleup</button>
          <button id={i} onClick={scaleDown}>scaledown</button>
        </Box>
      ))}
    </Container>
  )
})
