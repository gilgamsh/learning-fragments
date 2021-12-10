/*
 * @Author: your name
 * @Date: 2021-12-09 14:09:54
 * @LastEditTime: 2021-12-09 14:09:56
 * @LastEditors: Please set LastEditors
 * @Description: 鎵撳紑koroFileHeader鏌ョ湅閰嶇疆 杩涜璁剧疆: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \learning-fragments\鑴夊啿绁炵粡缃戠粶.cpp
 */
#include <bits/stdc++.h>

using namespace std;

//int a, b,   c, d;//a b用于计算神经元u v  c d用于传到

int N, S, P, T;
double deltaT;

typedef struct neu {
	double v, u;
	double a, b, c, d;
} neu;
neu n[1005];

int r[1005];
int gs_w[1005][1005];//入结点 出节点
int gs_d[1005][1005];
int g_i[1005][1005][11];
int g_num_a[1005];//记录出结点
int g_list_a[1005][1005];//入结点 出节点
int g_num_b[1005];//记录入结点
int g_list_b[1005][1005];
static unsigned long next = 1;

/* RAND_MAX assumed to be 32767 */
int myrand(void) {
	next = next * 1103515245 + 12345;
	return ((unsigned)(next / 65536) % 32768);
}



bool cal_neu(neu &x, i) {
	double tmpv, tmpu;
	tmpv = x.v + deltaT * (0.04 * x.v * x.v + 5 * x.v + 140 - x.u) + i;
	tmpu = x.u + deltaT * x.a * (x.b * x.v - x.u);
	x.v = tmpv;
	x.u = tmpu;
	if (tmpv >= 30) {
		x.v = x.c;
		x.u = x.u + x.d;
		return true;
	}
	return false;
}



int main() {
	cin >> N >> S >> P >> T;
	cin >> deltaT;
	int tmpN = N;
	int nindex = 0;
	while (tmpN) {
		int tmp;
		cin >> tmp;
		tmpN -= tmp;
		int v, u, a, b, c, d;
		cin >> v >> u >> a >> b >> c >> d;
		for (int i = 1; i <= tmp; i++) {
			n[nindex].a = a;
			n[nindex].b = b;
			n[nindex].c = c;
			n[nindex].d = d;
			n[nindex].u = u;
			n[nindex].v = v;
			nindex++;
		}
	}
	int tmpP = P;
	int pindex = 0;
	while (tmpP) {
		cin >> r[pindex];
		pindex++;
		tmpP--;
	}

	int tmpS = S;
//	int sindex = 0;
	while (tmpS) {
		int s, t, w, d;
		cin >> s >> t >> w >> d;
		gs_w[s][t] = w;
		gs_d[s][d] = d;
		g_list_a[g_num_a[s]] = t;
		g_num_a[s]++;
		g_list_b[g_num_b[t]] = s;
		g_num_b[t]++;
		tmpS--;
	}
	double t = 0;
	int times = T / deltaT;
	while (times) {
		for (int i = 0; i < P; i++) {
			if (r[i] > myrand() ){
				for(int j=1) 
			}
			}
		times--;
	}

}
