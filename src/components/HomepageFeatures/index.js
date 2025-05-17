import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Odoo ERP',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        记录Odoo ERP系统的开发实践与深度优化，分享从模块定制、性能调优到系统集成的全流程解决方案。
基于实际项目经验，总结可复用的代码模式与避坑指南，助力开发者与企业高效落地Odoo。
      </>
    ),
  },
  {
    title: '项目管理',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        * <code>CSPM</code><br/>
        * <code>Project Management Professional (PMP)®</code><br/>
        * <code>PRINCE2® Practitioner Certificate in Project Management</code>
      </>
    ),
  },
//  {
//    title: 'Powered by React',
//    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
//    description: (
//      <>
//        Extend or customize your website layout by reusing React. Docusaurus can
//        be extended while reusing the same header and footer.
//      </>
//    ),
//  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
