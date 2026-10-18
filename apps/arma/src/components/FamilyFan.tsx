import { useEffect, useRef } from 'react';
import { applyRules, pathOf, type ArmaRules } from '@pokenitsu/core';
import type { MasterMember } from '../api.ts';
import { CardPicture } from './CardPicture.tsx';
import { Link } from './Gallery.tsx';

const n = (x: number) => x.toLocaleString('es-CL');
/** what the case of a member would count with these rules: visible printings and the ones with copies */
export function memberProgress(m: MasterMember, rules: ArmaRules) {
  const result = applyRules(
    m.printings.map(p => ({ key: p.code, lang: p.lang, stamp: p.stamp, equivId: p.equiv_id })),
    rules,
  );
  const have = new Set(m.have);
  let total = 0,
    mine = 0;
  for (const p of m.printings)
    if (result.get(p.code)?.in ?? true) {
      total++;
      if (have.has(p.code)) mine++;
    }
  return { total, mine };
}

/**
 * The family's fan (master-set-familia-eevee): one portrait per member, the chosen one lit, each with its progress with
 * the active rules; on a phone it slides sideways with the chosen one in view.
 */
export function FamilyFan({ members, dex, rules }: { members: MasterMember[]; dex: number; rules: ArmaRules }) {
  const chosen = useRef<HTMLLIElement>(null);
  useEffect(() => {
    chosen.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [dex]);
  return (
    <nav className="fan" aria-label="Familia Eevee">
      <ul className="fan-row">
        {members.map(m => {
          const on = m.dex === dex;
          const empty = !m.printings.length;
          const p = empty ? null : memberProgress(m, rules);
          return (
            <li
              key={m.dex}
              ref={on ? chosen : undefined}
              className={'fan-item' + (on ? ' on' : '') + (empty ? ' empty' : '') + (p?.mine ? ' has' : '')}
            >
              <Link to={pathOf(m.dex)} label={`${m.name}: ${p ? `tienes ${n(p.mine)} de ${n(p.total)}` : 'sin traer'}`}>
                <span className="fan-art" aria-current={on ? 'page' : undefined}>
                  {m.pic ? (
                    <CardPicture ownCard={m.pic.own_card} img={m.pic.img} local={m.pic.local} reference={m.pic.ref} name={m.name} />
                  ) : (
                    <span className="blank">{m.name}</span>
                  )}
                </span>
                <span className="fan-name">{m.name}</span>
                <span className="fan-n">{p ? `${n(p.mine)} / ${n(p.total)}` : 'Sin traer'}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
