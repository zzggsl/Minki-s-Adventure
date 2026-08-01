// src/data/events.ts
import type { IEventData } from '../types';

// 미지의 이벤트(EVENT 노드) 풀
export const EVENT_DB: IEventData[] = [
    {
        id: 'strange_altar',
        title: '수상한 제단',
        desc: '낡은 제단이 희미하게 빛나고 있습니다.\n피를 바치면 더 강해질 것 같은 예감이 듭니다.',
        choices: [
            {
                text: '피를 바친다 (체력 -6, 최대 체력 +8)',
                effects: [{ type: 'DAMAGE', value: 6 }, { type: 'MAX_HP', value: 8 }],
                resultText: '제단이 붉게 타올랐습니다. 몸이 한층 단단해진 기분입니다.'
            },
            {
                text: '그냥 지나간다',
                effects: [],
                resultText: '괜히 건드리지 않기로 했습니다.'
            }
        ]
    },
    {
        id: 'abandoned_supply',
        title: '버려진 보급품',
        desc: '길가에 누군가 두고 간 보급품 상자가 있습니다.\n안에는 동전 주머니와 구급품이 함께 들어 있습니다.',
        choices: [
            {
                text: '동전 주머니를 챙긴다 (골드 +35)',
                effects: [{ type: 'GOLD', value: 35 }],
                resultText: '주머니 안에서 동전 35개를 찾았습니다.'
            },
            {
                text: '구급품을 챙긴다 (체력 +12)',
                effects: [{ type: 'HEAL', value: 12 }],
                resultText: '상처를 치료해 체력을 회복했습니다.'
            }
        ]
    },
    {
        id: 'old_smithy',
        title: '낡은 대장간',
        desc: '주인은 보이지 않지만 화덕에는 아직 불씨가 남아 있습니다.\n무기를 손볼 수 있을 것 같습니다.',
        choices: [
            {
                text: '카드 1장을 강화한다',
                effects: [{ type: 'UPGRADE_CARD' }],
                resultText: '무기를 벼려 한층 날카롭게 만들었습니다.'
            },
            {
                text: '불씨만 쬐고 간다 (체력 +6)',
                effects: [{ type: 'HEAL', value: 6 }],
                resultText: '따뜻한 불에 몸을 녹였습니다.'
            }
        ]
    },
    {
        id: 'wandering_merchant',
        title: '떠돌이 상인',
        desc: '수레를 끄는 상인이 말을 겁니다.\n"짐이 무거워서 말이야… 하나 사 가지 그래?"',
        choices: [
            {
                text: '카드를 산다 (골드 -50, 무작위 카드 1장)',
                requiresGold: 50,
                effects: [{ type: 'GOLD', value: -50 }, { type: 'ADD_RANDOM_CARD' }],
                resultText: '상인에게서 카드를 한 장 사들였습니다.'
            },
            {
                text: '거절한다',
                effects: [],
                resultText: '상인은 아쉬운 표정으로 수레를 끌고 떠났습니다.'
            }
        ]
    },
    {
        id: 'dusty_shrine',
        title: '먼지 쌓인 사당',
        desc: '오래된 사당 앞에 낡은 봉납함이 놓여 있습니다.\n짐을 덜어내면 마음이 가벼워질 것 같습니다.',
        choices: [
            {
                text: '카드 1장을 봉납한다 (카드 제거)',
                effects: [{ type: 'REMOVE_CARD' }],
                resultText: '카드를 봉납하자 덱이 한결 정돈되었습니다.'
            },
            {
                text: '동전을 바친다 (골드 -25, 체력 +15)',
                requiresGold: 25,
                effects: [{ type: 'GOLD', value: -25 }, { type: 'HEAL', value: 15 }],
                resultText: '알 수 없는 온기가 상처를 아물게 했습니다.'
            }
        ]
    }
];

/** 이벤트 풀에서 무작위로 하나를 고른다 */
export const getRandomEvent = (): IEventData => {
    return EVENT_DB[Math.floor(Math.random() * EVENT_DB.length)];
};
