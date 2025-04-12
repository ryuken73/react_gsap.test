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
  overflow: hidden;
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
const AUTO_ROTATE = true;
const INITIAL_Z_INDEX = [0, 3, 1, 2]
const NEXT_INDEX_MAP = {
  0: 1,
  1: 3,
  3: 2,
  2: 0
}

const SCALE_UP_FACTOR = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

const MOVE_OUT_FACTOR = {
  leftDown: [-1, 0.5],
  rightDown: [1, 0.5],
  up: [0, -1],
  down: [0, 1],
  leftUp: [-1, -0.5],
  rightUp: [1, -0.5],
}

const getMoveDirection = (topActive, leftActive, top, left) => {
  if(topActive === top && leftActive < left){
    if(topActive === 0){
      return 'rightDown'
    } else {
      return 'rightUp'
    }
  }
  if(topActive === top && leftActive > left){
    if(topActive === 0){
      return 'leftDown'
    } else {
      return 'leftUp'
    }
  }
  if(topActive < top ){
    return 'down'
  }
  if(topActive > top ){
    return 'up'
  }
  return null
}

export default React.memo(function FourByFour() {
  const topRef = React.useRef(null);
  const boxRefs = React.useRef([]);
  const orderedBoxRef = React.useRef([]);
  const [activeId, setActiveId] = React.useState(null);
  const [lastClickTime, setLastClickTime] = React.useState(null);
  const [lastButtonClickTime, setLastButtonClickTime] = React.useState(null);

  const [flipState, setFlipState] = React.useState(null);
  const zIndexRef = React.useRef(3);

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
      // const weights = [0, 0.1, 0.25, 0.4];
      // const weights = [0, 0.4/3, 0.2, 0.4];
      // const weights = [0, 3, 6, 9];
      const weights = [0, 0.2, 0.4, 0.6];
      // activeId와 일치하지 않는 경우, 순서에 따라 0.1씩 증가
      console.log('duraion:', inputIndex*0.3)
      return weights[inputIndex] ;
      // return 
    }
  }

  useGSAP(() => {
    if(lastClickTime === null){
      return
    }
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
      // duration: 0.4,
      duration: 0.2,
      // stagger: {
      //   from: activeId,
      //   amount : 1
      // },
      stagger: makeStagger(activeOrderNumber),
      absolute: true,
      fade: true,
      ease: 'power1.out',
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


  const ease = 'power2.out'
  // const ease = 'bounce.out'
  // const ease = 'bounce.inOut'
  // const ease = 'elastic.out'
  // const ease = 'elastic.inOut'
  // const ease = 'expo.out'
  // const ease = 'steps'
  const gsapScaleUp = contextSafe((id) => {
    const target = boxRefs.current[id];
    const targetRect = target.getBoundingClientRect();
    const {top: topActive, left: leftActive} = targetRect;
    const style = getComputedStyle(target)
    console.log(`id=${target.id}, order=${style.order}`)
    const translateFactor = SCALE_UP_FACTOR[style.order]
    gsap.to(target, {
      scale: 2.0, 
      x: `${translateFactor[0]*50}%`, 
      y:`${translateFactor[1]*50}%`, 
      duration: 0.5,
      ease
    })
    const otherBoxes = boxRefs.current.filter(box => box.id !== id)
    otherBoxes.forEach(box => {
      const boxRect = box.getBoundingClientRect();
      const {top, left} = boxRect
      const moveDirection = getMoveDirection(topActive, leftActive, top, left)
      if(moveDirection === null){
        alert('no way to move')
      }
      const moveOutFactor = MOVE_OUT_FACTOR[moveDirection];
      const scaleY = moveDirection !== 'up' && moveDirection !== 'down' ? 2 : 1;
      console.log(box, topActive, leftActive, top, left, moveDirection, moveOutFactor, scaleY)
      gsap.to(box, {
        x: `${moveOutFactor[0]*100}%`, 
        y:`${moveOutFactor[1]*100}%`, 
        scaleY, 
        opacity: 0.5, 
        duration: 0.5,
        ease
      })
    })
  })

  const gsapScaleDown = contextSafe((id) => {
    const target = boxRefs.current[id]
    console.log(target)
    gsap.to(target, {
      scale: 1, 
      x: '0', 
      y:'0', 
      duration: 0.5,
      ease,
      onComplete: () => {
        if(AUTO_ROTATE){
          setLastClickTime(Date.now())
        }
      }
    })
    const otherBoxes = boxRefs.current.filter(box => box.id !== id)
    otherBoxes.forEach(box => {
      gsap.to(box, {
        x: `0%`, 
        y:`0%`, 
        scale: 1, 
        opacity: 1, 
        duration: 0.5,
        ease
      })
    })
  })

  const scaleUp = React.useCallback((event) => {
    event.stopPropagation();
    const {id} = event.target;
    console.log('click:', id);
    event.target.parentNode.style.zIndex = zIndexRef.current + 1;
    zIndexRef.current += 1;
    gsapScaleUp(id)
    setActiveId(id)
  }, [gsapScaleUp, zIndexRef])

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
          // onClick={onClickBox}
          key={i}
          id={i}
          itemId={i}
          ref={el => boxRefs.current[i] = el}
          zIndex={INITIAL_Z_INDEX[i]}
        >{stage}{boxRefs.current[i]?.style.order}
          <button id={i} onClick={scaleUp}>scaleup</button>
          <button id={i} onClick={scaleDown}>scaledown</button>
        </Box>
      ))}
    </Container>
  )
})
